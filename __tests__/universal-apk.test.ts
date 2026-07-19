/**
 * Unit tests for universal APK extraction.
 */
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { extractUniversalApk } from '../src/artifacts/universal-apk.js'
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

describe('extractUniversalApk', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-universal-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
    vi.clearAllMocks()
  })

  it('returns undefined when extraction is disabled', async () => {
    const result = await extractUniversalApk({
      config: baseConfig(dir, { extractUniversalApk: false }),
      apksPath: join(dir, 'app.apks'),
      logger
    })
    expect(result).toBeUndefined()
  })

  it('plans extraction during dry-run', async () => {
    const result = await extractUniversalApk({
      config: baseConfig(dir, { dryRun: true }),
      apksPath: join(dir, 'app.apks'),
      logger
    })

    expect(result).toEqual({
      apkPath: join(dir, 'app.apk'),
      extracted: false,
      apksDeleted: false
    })
  })

  it('extracts universal.apk and keeps the archive by default', async () => {
    const apksPath = join(dir, 'app.apks')
    const payload = Buffer.from('apk-bytes')
    await writeFile(apksPath, zipSync({ 'universal.apk': payload }))

    const result = await extractUniversalApk({
      config: baseConfig(dir),
      apksPath,
      logger
    })

    expect(result?.extracted).toBe(true)
    expect(result?.apksDeleted).toBe(false)
    if (!result) {
      throw new Error('Expected extraction result')
    }
    await expect(readFile(result.apkPath)).resolves.toEqual(payload)
    await expect(access(apksPath)).resolves.toBeUndefined()
  })

  it('deletes the archive when keep-apks is false', async () => {
    const apksPath = join(dir, 'app.apks')
    await writeFile(
      apksPath,
      zipSync({ 'universal.apk': Buffer.from('apk-bytes') })
    )

    const result = await extractUniversalApk({
      config: baseConfig(dir, { keepApks: false }),
      apksPath,
      logger
    })

    expect(result?.apksDeleted).toBe(true)
    await expect(access(apksPath)).rejects.toThrow()
  })
})
