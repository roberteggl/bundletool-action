import { access } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, resolve } from 'node:path'
import { PrerequisiteError } from '../errors.js'

/**
 * Resolve a path relative to the working directory unless already absolute.
 */
export function resolveWorkspacePath(
  workingDirectory: string,
  targetPath: string
): string {
  return isAbsolute(targetPath)
    ? targetPath
    : resolve(workingDirectory, targetPath)
}

/**
 * Ensure a required input file exists.
 */
export async function ensureFileExists(
  filePath: string,
  label: string
): Promise<void> {
  try {
    await access(filePath)
  } catch {
    throw new PrerequisiteError(`${label} not found: ${filePath}`)
  }
}

/**
 * Derive the `.apks` output path from an explicit output or the AAB basename.
 */
export function resolveApksOutputPath(
  workingDirectory: string,
  aabFile: string,
  output?: string
): string {
  if (output) {
    const resolved = resolveWorkspacePath(workingDirectory, output)
    return resolved.endsWith('.apks') ? resolved : `${resolved}.apks`
  }

  const base = basename(aabFile, extname(aabFile) || undefined)
  return join(workingDirectory, `${base}.apks`)
}

/**
 * Resolve the directory used by `extract-apks` (`output-dir`, else `output`).
 */
export function resolveExtractOutputDir(
  workingDirectory: string,
  outputDir?: string,
  output?: string
): string {
  const target = outputDir ?? output
  if (!target) {
    throw new PrerequisiteError(
      'Provide "output-dir" (or "output") when command is "extract-apks".'
    )
  }
  return resolveWorkspacePath(workingDirectory, target)
}
