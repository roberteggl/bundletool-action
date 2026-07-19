/**
 * Unit tests for zip entry extraction.
 */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { extractZipEntry } from '../src/artifacts/zip.js'

describe('extractZipEntry', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-zip-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('extracts a named entry to disk', async () => {
    const zipPath = join(dir, 'app.apks')
    const destPath = join(dir, 'out', 'app.apk')
    const payload = Buffer.from('universal-apk-bytes')

    await writeFile(
      zipPath,
      zipSync({
        'universal.apk': payload,
        'toc.pb': Buffer.from('toc')
      })
    )

    await extractZipEntry(zipPath, 'universal.apk', destPath)
    await expect(readFile(destPath)).resolves.toEqual(payload)
  })

  it('fails when the entry is missing', async () => {
    const zipPath = join(dir, 'app.apks')
    await writeFile(zipPath, zipSync({ 'other.apk': Buffer.from('x') }))

    await expect(
      extractZipEntry(zipPath, 'universal.apk', join(dir, 'out.apk'))
    ).rejects.toThrow(/Entry "universal.apk" not found/)
  })
})
