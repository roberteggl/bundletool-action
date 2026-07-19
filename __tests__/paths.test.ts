/**
 * Unit tests for path helpers.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import {
  ensureFileExists,
  resolveApksOutputPath,
  resolveExtractOutputDir,
  resolveWorkspacePath
} from '../src/bundletool/paths.js'

describe('paths', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-paths-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('resolves relative paths against the working directory', () => {
    expect(resolveWorkspacePath(dir, 'app.aab')).toBe(join(dir, 'app.aab'))
  })

  it('derives .apks output from the aab basename', () => {
    expect(resolveApksOutputPath(dir, join(dir, 'release.aab'))).toBe(
      join(dir, 'release.apks')
    )
  })

  it('appends .apks when output has no extension', () => {
    expect(resolveApksOutputPath(dir, 'app.aab', 'out/app')).toBe(
      join(dir, 'out/app.apks')
    )
  })

  it('resolves extract output-dir', () => {
    expect(resolveExtractOutputDir(dir, 'extracted')).toBe(
      join(dir, 'extracted')
    )
    expect(resolveExtractOutputDir(dir, undefined, 'fallback')).toBe(
      join(dir, 'fallback')
    )
  })

  it('fails when extract output-dir is missing', () => {
    expect(() => resolveExtractOutputDir(dir)).toThrow(/Provide "output-dir"/)
  })

  it('ensures required files exist', async () => {
    const filePath = join(dir, 'app.aab')
    await writeFile(filePath, 'x')
    await expect(
      ensureFileExists(filePath, 'AAB file')
    ).resolves.toBeUndefined()
    await expect(
      ensureFileExists(join(dir, 'missing.aab'), 'AAB file')
    ).rejects.toThrow(/AAB file not found/)
  })
})
