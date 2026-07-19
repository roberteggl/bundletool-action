/**
 * Unit tests for the action's main functionality.
 */
import * as core from '@actions/core'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as installer from '../src/bundletool/installer.js'
import * as java from '../src/bundletool/java.js'

vi.mock('@actions/core', () => import('../__fixtures__/core.js'))
vi.mock('../src/bundletool/java.js', () => import('../__fixtures__/java.js'))
vi.mock(
  '../src/bundletool/installer.js',
  () => import('../__fixtures__/installer.js')
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
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('accepts a valid dry-run configuration and sets version output', async () => {
    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(java.ensureJava).toHaveBeenCalledWith('java', expect.anything())
    expect(installer.ensureBundletool).toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith('bundletool-version', '1.18.3')
    expect(core.notice).toHaveBeenCalledWith(
      expect.stringContaining('Dry run complete')
    )
  })

  it('sets bundletool-path when a JAR was installed', async () => {
    mockInputs({
      'aab-file': 'app.aab',
      command: 'build-apks',
      sign: 'false',
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

    await run()

    expect(core.setOutput).toHaveBeenCalledWith(
      'bundletool-path',
      '/cache/bundletool.jar'
    )
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('APK generation is not implemented yet')
    )
  })

  it('emits configuration warnings when keystore is ignored', async () => {
    mockInputs({
      'aab-file': 'app.aab',
      command: 'build-apks',
      keystore: 'release.jks',
      'keystore-password': 'secret',
      'key-alias': 'upload',
      sign: 'false',
      'dry-run': 'true'
    })

    await run()

    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('sign=false')
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

  it('fails when signing is enabled without a keystore password', async () => {
    mockInputs({
      'aab-file': 'app.aab',
      command: 'build-apks',
      keystore: 'release.jks',
      'key-alias': 'upload',
      sign: 'true',
      'dry-run': 'true'
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Input "keystore-password" is required when signing is enabled.'
    )
  })
})
