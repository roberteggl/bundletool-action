/**
 * Unit tests for extract-apks command planning/execution.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { extractApks } from '../src/bundletool/commands/extract-apks.js'
import type { ActionConfig } from '../src/config/types.js'
import { createLogger } from '../src/logging/logger.js'

vi.mock('../src/bundletool/runner.js', () => ({
  runBundletool: vi.fn(async () => undefined)
}))

const { runBundletool } = await import('../src/bundletool/runner.js')

function baseConfig(overrides: Partial<ActionConfig> = {}): ActionConfig {
  return {
    command: 'extract-apks',
    apksFile: 'app.apks',
    mode: 'universal',
    outputDir: 'out',
    deviceSpec: 'device.json',
    bundletool: { version: '1.18.3' },
    cache: true,
    javaBin: 'java',
    signing: {
      signRequested: false,
      hasKeystoreMaterial: false,
      enabled: false
    },
    extractUniversalApk: false,
    keepApks: true,
    extraArgs: [],
    workingDirectory: '.',
    dryRun: true,
    verbose: false,
    ...overrides
  }
}

describe('extractApks', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-extract-'))
    vi.mocked(runBundletool).mockClear()
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('plans extract-apks without executing in dry-run', async () => {
    const result = await extractApks({
      config: baseConfig({ workingDirectory: dir }),
      jarPath: '/cache/bundletool.jar',
      logger: createLogger(false)
    })

    expect(result.executed).toBe(false)
    expect(result.outputDir).toBe(join(dir, 'out'))
    expect(result.args).toEqual([
      'extract-apks',
      `--apks=${join(dir, 'app.apks')}`,
      `--output-dir=${join(dir, 'out')}`,
      `--device-spec=${join(dir, 'device.json')}`
    ])
    expect(runBundletool).not.toHaveBeenCalled()
  })

  it('executes extract-apks when files exist', async () => {
    await writeFile(join(dir, 'app.apks'), 'apks')
    await writeFile(join(dir, 'device.json'), '{}')

    const result = await extractApks({
      config: baseConfig({ workingDirectory: dir, dryRun: false }),
      jarPath: '/cache/bundletool.jar',
      logger: createLogger(false)
    })

    expect(result.executed).toBe(true)
    expect(runBundletool).toHaveBeenCalledWith(
      expect.objectContaining({
        jarPath: '/cache/bundletool.jar',
        args: expect.arrayContaining(['extract-apks'])
      })
    )
  })
})
