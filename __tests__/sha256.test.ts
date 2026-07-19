/**
 * Unit tests for SHA-256 helpers.
 */
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sha256File, verifySha256 } from '../src/bundletool/sha256.js'

describe('sha256', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-sha-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('computes the digest of a file', async () => {
    const filePath = join(dir, 'sample.bin')
    const contents = Buffer.from('bundletool')
    await writeFile(filePath, contents)

    const expected = createHash('sha256').update(contents).digest('hex')
    await expect(sha256File(filePath)).resolves.toBe(expected)
  })

  it('accepts a matching digest', async () => {
    const filePath = join(dir, 'sample.bin')
    const contents = Buffer.from('ok')
    await writeFile(filePath, contents)
    const expected = createHash('sha256').update(contents).digest('hex')

    await expect(verifySha256(filePath, expected)).resolves.toBeUndefined()
  })

  it('rejects a mismatched digest', async () => {
    const filePath = join(dir, 'sample.bin')
    await writeFile(filePath, 'nope')

    await expect(verifySha256(filePath, 'a'.repeat(64))).rejects.toThrow(
      /SHA-256 mismatch/
    )
  })
})
