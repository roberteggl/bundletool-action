import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CleanupRegistry } from '../cleanup.js'
import { SigningError } from '../errors.js'
import type { Logger } from '../logging/logger.js'

/**
 * Write a password to a restrictive temp file for bundletool `file:` args.
 */
export async function writePasswordFile(
  directory: string,
  fileName: string,
  password: string,
  cleanup: CleanupRegistry,
  logger: Logger
): Promise<string> {
  const filePath = join(directory, fileName)

  try {
    await writeFile(filePath, password, { encoding: 'utf8', mode: 0o600 })
  } catch (error) {
    throw new SigningError(
      `Failed to write password file "${fileName}": ${error instanceof Error ? error.message : String(error)}`
    )
  }

  cleanup.register(filePath)
  logger.verbose(`Wrote password file ${fileName}`)
  return filePath
}

/**
 * Create a private temporary directory for signing material.
 */
export async function createSigningTempDir(
  cleanup: CleanupRegistry
): Promise<string> {
  const directory = join(
    tmpdir(),
    `bundletool-action-signing-${process.pid}-${Date.now()}`
  )

  try {
    await mkdir(directory, { recursive: true, mode: 0o700 })
  } catch (error) {
    throw new SigningError(
      `Failed to create signing temp directory: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  cleanup.register(directory)
  return directory
}
