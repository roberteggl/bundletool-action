/**
 * Unit tests for the cleanup registry.
 */
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CleanupRegistry } from '../src/cleanup.js'
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

describe('CleanupRegistry', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bundletool-cleanup-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
    vi.clearAllMocks()
  })

  it('removes registered files', async () => {
    const filePath = join(dir, 'secret.pass')
    await writeFile(filePath, 'secret')

    const cleanup = new CleanupRegistry()
    cleanup.register(filePath)
    await cleanup.cleanup(logger)

    await expect(access(filePath)).rejects.toThrow()
    expect(logger.verbose).toHaveBeenCalledWith(
      expect.stringContaining('Cleaned up')
    )
  })
})
