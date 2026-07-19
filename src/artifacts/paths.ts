import { basename, dirname, extname, join } from 'node:path'
import { resolveWorkspacePath } from '../bundletool/paths.js'

/**
 * Derive the destination path for an extracted universal APK.
 */
export function resolveUniversalApkPath(options: {
  workingDirectory: string
  aabFile?: string
  apksPath: string
  output?: string
  outputDir?: string
}): string {
  const { workingDirectory, aabFile, apksPath, output, outputDir } = options

  if (output?.endsWith('.apk')) {
    return resolveWorkspacePath(workingDirectory, output)
  }

  const baseSource = aabFile ?? apksPath
  const base = basename(baseSource, extname(baseSource) || undefined)

  if (outputDir) {
    return join(
      resolveWorkspacePath(workingDirectory, outputDir),
      `${base}.apk`
    )
  }

  return join(dirname(apksPath), `${base}.apk`)
}
