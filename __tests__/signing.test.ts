/**
 * Unit tests for signing materialization.
 */
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CleanupRegistry } from '../src/cleanup.js'
import type { SigningConfig } from '../src/config/types.js'
import type { Logger } from '../src/logging/logger.js'
import { materializeSigning } from '../src/signing/keystore.js'

const logger: Logger = {
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  group: vi.fn(async (_name, fn) => fn())
}

function enabledSigning(overrides: Partial<SigningConfig> = {}): SigningConfig {
  return {
    keystorePassword: 'store-secret',
    keyAlias: 'upload',
    keyPassword: 'key-secret',
    signRequested: true,
    hasKeystoreMaterial: true,
    enabled: true,
    ...overrides
  }
}

describe('materializeSigning', () => {
  let workspace: string
  let cleanup: CleanupRegistry

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'bundletool-signing-test-'))
    cleanup = new CleanupRegistry()
  })

  afterEach(async () => {
    await cleanup.cleanup(logger)
    await rm(workspace, { recursive: true, force: true })
    vi.clearAllMocks()
  })

  it('returns undefined when signing is disabled', async () => {
    const result = await materializeSigning(
      enabledSigning({ enabled: false, hasKeystoreMaterial: false }),
      {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      }
    )

    expect(result).toBeUndefined()
  })

  it('skips file writes during dry-run', async () => {
    const result = await materializeSigning(
      enabledSigning({ keystore: 'release.jks' }),
      {
        workingDirectory: workspace,
        dryRun: true,
        cleanup,
        logger
      }
    )

    expect(result).toBeUndefined()
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Dry run: would materialize')
    )
  })

  it('materializes a keystore path and password files', async () => {
    const keystorePath = join(workspace, 'release.jks')
    await writeFile(keystorePath, Buffer.from('keystore-bytes'))

    const result = await materializeSigning(
      enabledSigning({ keystore: 'release.jks' }),
      {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        keystorePath,
        keyAlias: 'upload'
      })
    )

    if (!result) {
      throw new Error('Expected materialized signing')
    }

    await expect(readFile(result.keystorePasswordFile, 'utf8')).resolves.toBe(
      'store-secret'
    )
    await expect(readFile(result.keyPasswordFile, 'utf8')).resolves.toBe(
      'key-secret'
    )
  })

  it('decodes keystore-base64 into a temp keystore file', async () => {
    const payload = Buffer.from('fake-keystore')
    const result = await materializeSigning(
      enabledSigning({
        keystoreBase64: payload.toString('base64')
      }),
      {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      }
    )

    expect(result).toBeDefined()
    if (!result) {
      throw new Error('Expected materialized signing')
    }

    await expect(readFile(result.keystorePath)).resolves.toEqual(payload)
  })

  it('fails when the keystore path does not exist', async () => {
    await expect(
      materializeSigning(enabledSigning({ keystore: 'missing.jks' }), {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      })
    ).rejects.toThrow(/Keystore file not found/)
  })

  it('cleans up temporary signing files', async () => {
    const payload = Buffer.from('fake-keystore')
    const result = await materializeSigning(
      enabledSigning({
        keystoreBase64: payload.toString('base64')
      }),
      {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      }
    )

    if (!result) {
      throw new Error('Expected materialized signing')
    }

    const keystorePath = result.keystorePath
    await cleanup.cleanup(logger)

    await expect(access(keystorePath)).rejects.toThrow()
  })

  it('fails when signing is enabled without required passwords', async () => {
    await expect(
      materializeSigning(enabledSigning({ keystorePassword: undefined }), {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      })
    ).rejects.toThrow(/keystore-password, key-alias, and key-password/)
  })

  it('fails when keystore-base64 decodes to an empty file', async () => {
    await expect(
      materializeSigning(enabledSigning({ keystoreBase64: '=' }), {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      })
    ).rejects.toThrow(/decoded to an empty keystore/)
  })

  it('fails when signing is enabled without keystore material', async () => {
    await expect(
      materializeSigning(
        enabledSigning({ keystore: undefined, keystoreBase64: undefined }),
        {
          workingDirectory: workspace,
          dryRun: false,
          cleanup,
          logger
        }
      )
    ).rejects.toThrow(/neither "keystore" nor "keystore-base64"/)
  })

  it('accepts an absolute keystore path', async () => {
    const keystorePath = join(workspace, 'release.jks')
    await writeFile(keystorePath, Buffer.from('keystore-bytes'))

    const result = await materializeSigning(
      enabledSigning({ keystore: keystorePath }),
      {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      }
    )

    expect(result?.keystorePath).toBe(keystorePath)
    expect(logger.info).toHaveBeenCalledWith(
      `Using keystore at ${keystorePath}`
    )
  })

  it('fails when keystore-base64 cannot be decoded', async () => {
    const from = Buffer.from
    vi.spyOn(Buffer, 'from').mockImplementation((value, encoding) => {
      if (encoding === 'base64') {
        throw new Error('invalid base64')
      }
      return from(value, encoding)
    })

    await expect(
      materializeSigning(enabledSigning({ keystoreBase64: 'YWJj' }), {
        workingDirectory: workspace,
        dryRun: false,
        cleanup,
        logger
      })
    ).rejects.toThrow(/Failed to decode keystore-base64/)

    vi.restoreAllMocks()
  })
})
