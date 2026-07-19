/**
 * Unit tests for the build-apks command.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ActionConfig } from '../src/config/types.js'
import type { Logger } from '../src/logging/logger.js'

const logger: Logger = {
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  group: vi.fn(async (_name, fn) => fn())
}

const runBundletool = vi.fn(async () => ({ exitCode: 0 }))
vi.mock('../src/bundletool/runner.js', () => ({ runBundletool }))

const { buildApks } = await import('../src/bundletool/commands/build-apks.js')

function baseConfig(
  dir: string,
  overrides: Partial<ActionConfig> = {}
): ActionConfig {
  return {
    command: 'build-apks',
    aabFile: 'app.aab',
    mode: 'universal',
    bundletool: { version: '1.18.3' },
    cache: true,
    javaBin: 'java',
    signing: {
      signRequested: false,
      hasKeystoreMaterial: false,
      enabled: false
    },
    extractUniversalApk: true,
    keepApks: true,
    extraArgs: [],
    workingDirectory: dir,
    dryRun: false,
    verbose: false,
    ...overrides
  }
}

describe('buildApks', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-build-'))
    runBundletool.mockClear()
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('plans without executing during dry-run', async () => {
    const result = await buildApks({
      config: baseConfig(dir, { dryRun: true }),
      jarPath: '/cache/bundletool.jar',
      logger
    })

    expect(result.executed).toBe(false)
    expect(result.apksPath).toBe(join(dir, 'app.apks'))
    expect(runBundletool).not.toHaveBeenCalled()
  })

  it('executes bundletool when an aab exists', async () => {
    await writeFile(join(dir, 'app.aab'), 'aab')

    const result = await buildApks({
      config: baseConfig(dir),
      jarPath: '/cache/bundletool.jar',
      logger
    })

    expect(result.executed).toBe(true)
    expect(runBundletool).toHaveBeenCalledWith(
      expect.objectContaining({
        javaBin: 'java',
        jarPath: '/cache/bundletool.jar',
        args: expect.arrayContaining([
          'build-apks',
          `--bundle=${join(dir, 'app.aab')}`,
          `--output=${join(dir, 'app.apks')}`,
          '--mode=universal',
          '--overwrite'
        ])
      })
    )
  })

  it('fails when the aab is missing', async () => {
    await expect(
      buildApks({
        config: baseConfig(dir),
        jarPath: '/cache/bundletool.jar',
        logger
      })
    ).rejects.toThrow(/AAB file not found/)
  })
})
