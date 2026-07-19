import { access, writeFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import type { CleanupRegistry } from '../cleanup.js'
import type { SigningConfig } from '../config/types.js'
import { SigningError } from '../errors.js'
import type { Logger } from '../logging/logger.js'
import { createSigningTempDir, writePasswordFile } from './passwords.js'

export interface MaterializedSigning {
  keystorePath: string
  keyAlias: string
  keystorePasswordFile: string
  keyPasswordFile: string
}

export interface MaterializeSigningOptions {
  workingDirectory: string
  dryRun: boolean
  cleanup: CleanupRegistry
  logger: Logger
}

async function resolveKeystorePath(
  signing: SigningConfig,
  workingDirectory: string,
  tempDir: string,
  cleanup: CleanupRegistry,
  logger: Logger
): Promise<string> {
  if (signing.keystoreBase64) {
    let bytes: Buffer
    try {
      bytes = Buffer.from(signing.keystoreBase64, 'base64')
    } catch (error) {
      throw new SigningError(
        `Failed to decode keystore-base64: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (bytes.length === 0) {
      throw new SigningError(
        'Input "keystore-base64" decoded to an empty keystore.'
      )
    }

    const keystorePath = resolve(tempDir, 'signing.keystore')
    try {
      await writeFile(keystorePath, bytes, { mode: 0o600 })
    } catch (error) {
      throw new SigningError(
        `Failed to write decoded keystore: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    cleanup.register(keystorePath)
    logger.info('Materialized keystore from keystore-base64')
    return keystorePath
  }

  if (!signing.keystore) {
    throw new SigningError(
      'Signing is enabled but neither "keystore" nor "keystore-base64" was provided.'
    )
  }

  const keystorePath = isAbsolute(signing.keystore)
    ? signing.keystore
    : resolve(workingDirectory, signing.keystore)

  try {
    await access(keystorePath)
  } catch {
    throw new SigningError(`Keystore file not found: ${keystorePath}`)
  }

  logger.info(`Using keystore at ${keystorePath}`)
  return keystorePath
}

/**
 * Materialize keystore + password files for bundletool signing flags.
 *
 * Passwords are written to temp files so they are never passed on the process
 * argv via `pass:`. Callers must invoke cleanup after bundletool finishes.
 */
export async function materializeSigning(
  signing: SigningConfig,
  options: MaterializeSigningOptions
): Promise<MaterializedSigning | undefined> {
  const { workingDirectory, dryRun, cleanup, logger } = options

  if (!signing.enabled) {
    logger.verbose('Signing materialization skipped (signing disabled)')
    return undefined
  }

  if (!signing.keystorePassword || !signing.keyAlias || !signing.keyPassword) {
    throw new SigningError(
      'Signing requires keystore-password, key-alias, and key-password.'
    )
  }

  if (dryRun) {
    logger.info(
      'Dry run: would materialize keystore and password files for signing'
    )
    return undefined
  }

  const tempDir = await createSigningTempDir(cleanup)
  const keystorePath = await resolveKeystorePath(
    signing,
    workingDirectory,
    tempDir,
    cleanup,
    logger
  )

  const keystorePasswordFile = await writePasswordFile(
    tempDir,
    'keystore.pass',
    signing.keystorePassword,
    cleanup,
    logger
  )
  const keyPasswordFile = await writePasswordFile(
    tempDir,
    'key.pass',
    signing.keyPassword,
    cleanup,
    logger
  )

  logger.info('Signing credentials materialized')
  return {
    keystorePath,
    keyAlias: signing.keyAlias,
    keystorePasswordFile,
    keyPasswordFile
  }
}
