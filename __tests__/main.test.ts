/**
 * Unit tests for the action's main functionality.
 */
import * as core from '@actions/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as universalApk from '../src/artifacts/universal-apk.js'
import * as buildApksCommand from '../src/bundletool/commands/build-apks.js'
import * as extractApksCommand from '../src/bundletool/commands/extract-apks.js'
import * as installer from '../src/bundletool/installer.js'
import * as java from '../src/bundletool/java.js'
import * as signing from '../src/signing/keystore.js'

vi.mock('@actions/core', () => import('../__fixtures__/core.js'))
vi.mock('../src/bundletool/java.js', () => import('../__fixtures__/java.js'))
vi.mock(
  '../src/bundletool/installer.js',
  () => import('../__fixtures__/installer.js')
)
vi.mock(
  '../src/signing/keystore.js',
  () => import('../__fixtures__/signing.js')
)
vi.mock(
  '../src/bundletool/commands/build-apks.js',
  () => import('../__fixtures__/build-apks.js')
)
vi.mock(
  '../src/bundletool/commands/extract-apks.js',
  () => import('../__fixtures__/extract-apks.js')
)
vi.mock(
  '../src/artifacts/universal-apk.js',
  () => import('../__fixtures__/universal-apk.js')
)

const { run } = await import('../src/main.js')

function mockInputs(values: Record<string, string>): void {
  core.getInput.mockImplementation((name: string) => values[name] ?? '')
}

describe('main.ts', () => {
  beforeEach(() => {
    mockInputs({
      'aab-file': 'app/build/outputs/bundle/release/app-release.aab',
      command: 'build-apks',
      mode: 'universal',
      'bundletool-version': 'latest',
      cache: 'true',
      'java-bin': 'java',
      sign: 'false',
      'extract-universal-apk': 'true',
      'keep-apks': 'true',
      'working-directory': '.',
      'dry-run': 'true',
      verbose: 'false'
    })

    installer.ensureBundletool.mockResolvedValue({
      version: '1.18.3',
      downloadUrl:
        'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar',
      fromCache: false,
      dryRun: true
    })

    signing.materializeSigning.mockResolvedValue(undefined)
    buildApksCommand.buildApks.mockResolvedValue({
      apksPath: '/tmp/app-release.apks',
      args: ['build-apks'],
      executed: false
    })
    universalApk.extractUniversalApk.mockResolvedValue({
      apkPath: '/tmp/app-release.apk',
      extracted: false,
      apksDeleted: false
    })
    extractApksCommand.extractApks.mockResolvedValue({
      apksPath: '/tmp/app.apks',
      outputDir: '/tmp/out',
      args: ['extract-apks'],
      executed: false
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('accepts a valid dry-run configuration and sets outputs', async () => {
    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(java.ensureJava).toHaveBeenCalledWith('java', expect.anything())
    expect(installer.ensureBundletool).toHaveBeenCalled()
    expect(signing.materializeSigning).toHaveBeenCalled()
    expect(buildApksCommand.buildApks).toHaveBeenCalled()
    expect(universalApk.extractUniversalApk).toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith('bundletool-version', '1.18.3')
    expect(core.setOutput).toHaveBeenCalledWith(
      'apks-path',
      '/tmp/app-release.apks'
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'apk-path',
      '/tmp/app-release.apk'
    )
    expect(core.notice).toHaveBeenCalledWith(
      expect.stringContaining('Dry run complete')
    )
  })

  it('extracts a universal apk after build-apks', async () => {
    mockInputs({
      'aab-file': 'app.aab',
      command: 'build-apks',
      mode: 'universal',
      sign: 'false',
      'extract-universal-apk': 'true',
      'keep-apks': 'true',
      'dry-run': 'false'
    })

    installer.ensureBundletool.mockResolvedValue({
      version: '1.18.3',
      jarPath: '/cache/bundletool.jar',
      downloadUrl:
        'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar',
      fromCache: true,
      dryRun: false
    })

    buildApksCommand.buildApks.mockResolvedValue({
      apksPath: '/tmp/app.apks',
      args: ['build-apks'],
      executed: true
    })

    universalApk.extractUniversalApk.mockResolvedValue({
      apkPath: '/tmp/app.apk',
      extracted: true,
      apksDeleted: false
    })

    await run()

    expect(universalApk.extractUniversalApk).toHaveBeenCalledWith(
      expect.objectContaining({
        apksPath: '/tmp/app.apks'
      })
    )
    expect(core.setOutput).toHaveBeenCalledWith('apk-path', '/tmp/app.apk')
    expect(core.notice).toHaveBeenCalledWith(
      expect.stringContaining('Universal APK ready')
    )
  })

  it('omits apks-path when the archive was deleted', async () => {
    mockInputs({
      'aab-file': 'app.aab',
      command: 'build-apks',
      sign: 'false',
      'extract-universal-apk': 'true',
      'keep-apks': 'false',
      'dry-run': 'false'
    })

    installer.ensureBundletool.mockResolvedValue({
      version: '1.18.3',
      jarPath: '/cache/bundletool.jar',
      downloadUrl:
        'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar',
      fromCache: true,
      dryRun: false
    })

    buildApksCommand.buildApks.mockResolvedValue({
      apksPath: '/tmp/app.apks',
      args: ['build-apks'],
      executed: true
    })

    universalApk.extractUniversalApk.mockResolvedValue({
      apkPath: '/tmp/app.apk',
      extracted: true,
      apksDeleted: true
    })

    await run()

    expect(core.setOutput).not.toHaveBeenCalledWith(
      'apks-path',
      expect.anything()
    )
    expect(core.setOutput).toHaveBeenCalledWith('apk-path', '/tmp/app.apk')
  })

  it('runs extract-apks and sets output-dir', async () => {
    mockInputs({
      command: 'extract-apks',
      'apks-file': 'app.apks',
      'device-spec': 'device.json',
      'output-dir': 'out',
      sign: 'false',
      'dry-run': 'true'
    })

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(extractApksCommand.extractApks).toHaveBeenCalled()
    expect(buildApksCommand.buildApks).not.toHaveBeenCalled()
    expect(signing.materializeSigning).not.toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith('apks-path', '/tmp/app.apks')
    expect(core.setOutput).toHaveBeenCalledWith('output-dir', '/tmp/out')
    expect(core.notice).toHaveBeenCalledWith(
      expect.stringContaining('extract-apks')
    )
  })

  it('fails when aab-file is missing for build-apks', async () => {
    mockInputs({
      command: 'build-apks',
      sign: 'false',
      'dry-run': 'true'
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Input "aab-file" is required when command is "build-apks".'
    )
    expect(installer.ensureBundletool).not.toHaveBeenCalled()
  })
})
