/**
 * Unit tests for signing password file helpers.
 */
import { afterEach, expect, it, vi } from 'vitest'
import { CleanupRegistry } from '../src/cleanup.js'
import { SigningError } from '../src/errors.js'
import type { Logger } from '../src/logging/logger.js'

const { mkdir, writeFile } = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn()
}))

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...actual,
    mkdir,
    writeFile
  }
})

const { createSigningTempDir, writePasswordFile } = await import(
  '../src/signing/passwords.js'
)

const logger: Logger = {
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  group: vi.fn(async (_name, fn) => fn())
}

describe('signing password helpers', () => {
  const cleanup = new CleanupRegistry()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('writes password files and registers them for cleanup', async () => {
    writeFile.mockResolvedValue(undefined)

    const filePath = await writePasswordFile(
      '/tmp/signing',
      'keystore.pass',
      'secret',
      cleanup,
      logger
    )

    expect(filePath).toBe('/tmp/signing/keystore.pass')
    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/signing/keystore.pass',
      'secret',
      {
        encoding: 'utf8',
        mode: 0o600
      }
    )
    expect(logger.verbose).toHaveBeenCalledWith(
      'Wrote password file keystore.pass'
    )
  })

  it('throws when a password file cannot be written', async () => {
    writeFile.mockRejectedValue(new Error('permission denied'))

    await expect(
      writePasswordFile(
        '/tmp/signing',
        'keystore.pass',
        'secret',
        cleanup,
        logger
      )
    ).rejects.toThrow(/Failed to write password file "keystore.pass"/)
  })

  it('creates a signing temp directory and registers it for cleanup', async () => {
    mkdir.mockResolvedValue(undefined)

    const directory = await createSigningTempDir(cleanup)

    expect(directory).toContain('bundletool-action-signing-')
    expect(mkdir).toHaveBeenCalledWith(
      directory,
      expect.objectContaining({ recursive: true, mode: 0o700 })
    )
  })

  it('throws when the signing temp directory cannot be created', async () => {
    mkdir.mockRejectedValue(new Error('disk full'))

    await expect(createSigningTempDir(cleanup)).rejects.toThrow(
      /Failed to create signing temp directory/
    )
    await expect(createSigningTempDir(cleanup)).rejects.toBeInstanceOf(
      SigningError
    )
  })
})
