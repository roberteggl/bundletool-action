import { mkdir } from 'node:fs/promises'
import type { ActionConfig } from '../../config/types.js'
import type { Logger } from '../../logging/logger.js'
import { buildExtractApksArgs, redactBundletoolArgs } from '../args.js'
import {
  ensureFileExists,
  resolveExtractOutputDir,
  resolveWorkspacePath
} from '../paths.js'
import { runBundletool } from '../runner.js'

export interface ExtractApksResult {
  apksPath: string
  outputDir: string
  args: string[]
  executed: boolean
}

export interface ExtractApksOptions {
  config: ActionConfig
  jarPath: string
  logger: Logger
}

/**
 * Plan and optionally execute `bundletool extract-apks`.
 */
export async function extractApks(
  options: ExtractApksOptions
): Promise<ExtractApksResult> {
  const { config, jarPath, logger } = options

  if (!config.apksFile) {
    throw new Error('apks-file is required for extract-apks')
  }
  if (!config.deviceSpec) {
    throw new Error('device-spec is required for extract-apks')
  }

  const apksPath = resolveWorkspacePath(
    config.workingDirectory,
    config.apksFile
  )
  const deviceSpec = resolveWorkspacePath(
    config.workingDirectory,
    config.deviceSpec
  )
  const outputDir = resolveExtractOutputDir(
    config.workingDirectory,
    config.outputDir,
    config.output
  )

  const args = buildExtractApksArgs({
    apksFile: apksPath,
    outputDir,
    deviceSpec,
    extraArgs: config.extraArgs
  })

  logger.info(`APKS: ${apksPath}`)
  logger.info(`Device spec: ${deviceSpec}`)
  logger.info(`Output dir: ${outputDir}`)
  logger.verbose(`extract-apks args: ${redactBundletoolArgs(args).join(' ')}`)

  if (config.dryRun) {
    logger.info('Dry run: skipping bundletool extract-apks execution')
    return { apksPath, outputDir, args, executed: false }
  }

  await ensureFileExists(apksPath, 'APKS file')
  await ensureFileExists(deviceSpec, 'Device spec')
  await mkdir(outputDir, { recursive: true })

  await runBundletool({
    javaBin: config.javaBin,
    jarPath,
    args,
    cwd: config.workingDirectory,
    logger
  })

  logger.info(`Extracted device APKs to ${outputDir}`)
  return { apksPath, outputDir, args, executed: true }
}
