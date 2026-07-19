import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { unzipSync } from 'fflate'
import { ArtifactError } from '../errors.js'

/**
 * Extract a single entry from a zip archive to disk.
 */
export async function extractZipEntry(
  zipPath: string,
  entryName: string,
  destinationPath: string
): Promise<void> {
  let archive: Uint8Array
  try {
    archive = await readFile(zipPath)
  } catch (error) {
    throw new ArtifactError(
      `Failed to read archive ${zipPath}: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(archive)
  } catch (error) {
    throw new ArtifactError(
      `Failed to unzip ${zipPath}: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const match = Object.keys(entries).find((key) => {
    const name = key.replace(/\\/g, '/')
    return name === entryName || basename(name) === entryName
  })

  if (!match || !entries[match]) {
    const available = Object.keys(entries)
      .map((key) => basename(key.replace(/\\/g, '/')))
      .filter(Boolean)
      .join(', ')
    throw new ArtifactError(
      `Entry "${entryName}" not found in ${zipPath}.${available ? ` Found: ${available}` : ''}`
    )
  }

  await mkdir(dirname(destinationPath), { recursive: true })
  await writeFile(destinationPath, entries[match])
}
