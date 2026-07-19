import * as io from '@actions/io'
import type { ActionConfig } from '../config/types.js'
import type { Logger } from '../logging/logger.js'
import { resolveUniversalApkPath } from './paths.js'
import { extractZipEntry } from './zip.js'

export interface UniversalApkResult {
  apkPath: string
  extracted: boolean
  apksDeleted: boolean
}

export interface ExtractUniversalApkOptions {
  config: ActionConfig
  apksPath: string
  logger: Logger
}

/**
 * Extract `universal.apk` from an `.apks` archive (zip).
 */
export async function extractUniversalApk(
  options: ExtractUniversalApkOptions
): Promise<UniversalApkResult | undefined> {
  const { config, apksPath, logger } = options

  if (!config.extractUniversalApk || config.mode !== 'universal') {
    logger.verbose('Universal APK extraction skipped')
    return undefined
  }

  const apkPath = resolveUniversalApkPath({
    workingDirectory: config.workingDirectory,
    aabFile: config.aabFile,
    apksPath,
    output: config.output,
    outputDir: config.outputDir
  })

  logger.info(`Universal APK destination: ${apkPath}`)

  if (config.dryRun) {
    logger.info('Dry run: skipping universal APK extraction')
    return { apkPath, extracted: false, apksDeleted: false }
  }

  await extractZipEntry(apksPath, 'universal.apk', apkPath)
  logger.info(`Extracted universal APK to ${apkPath}`)

  let apksDeleted = false
  if (!config.keepApks) {
    await io.rmRF(apksPath)
    apksDeleted = true
    logger.info(`Removed APK set archive (${apksPath}) because keep-apks=false`)
  }

  return { apkPath, extracted: true, apksDeleted }
}
