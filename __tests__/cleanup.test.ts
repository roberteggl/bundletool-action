/**
 * Unit tests for the cleanup registry.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CleanupRegistry } from '../src/cleanup.js'
import type { Logger } from '../src/logging/logger.js'

const rmRF = vi.hoisted(() => vi.fn())

vi.mock('@actions/io', () => ({
  rmRF
}))

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
    rmRF.mockResolvedValue(undefined)

    const cleanup = new CleanupRegistry()
    cleanup.register(filePath)
    await cleanup.cleanup(logger)

    expect(rmRF).toHaveBeenCalledWith(filePath)
    expect(logger.verbose).toHaveBeenCalledWith(
      expect.stringContaining('Cleaned up')
    )
  })

  it('warns when cleanup fails for a registered path', async () => {
    rmRF.mockRejectedValue(new Error('permission denied'))

    const cleanup = new CleanupRegistry()
    cleanup.register('/tmp/missing')
    await cleanup.cleanup(logger)

    expect(logger.warning).toHaveBeenCalledWith(
      'Failed to clean up /tmp/missing: permission denied'
    )
  })

  it('warns with a stringified error when cleanup fails with a non-Error', async () => {
    rmRF.mockRejectedValue('disk full')

    const cleanup = new CleanupRegistry()
    cleanup.register('/tmp/missing')
    await cleanup.cleanup(logger)

    expect(logger.warning).toHaveBeenCalledWith(
      'Failed to clean up /tmp/missing: disk full'
    )
  })
})
