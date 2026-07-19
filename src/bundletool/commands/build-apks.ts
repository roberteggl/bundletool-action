import type { ActionConfig } from '../../config/types.js'
import type { Logger } from '../../logging/logger.js'
import type { MaterializedSigning } from '../../signing/keystore.js'
import { buildApksArgs, redactBundletoolArgs } from '../args.js'
import {
  ensureFileExists,
  resolveApksOutputPath,
  resolveWorkspacePath
} from '../paths.js'
import { runBundletool } from '../runner.js'

export interface BuildApksResult {
  apksPath: string
  args: string[]
  executed: boolean
}

export interface BuildApksOptions {
  config: ActionConfig
  jarPath: string
  signing?: MaterializedSigning
  logger: Logger
}

/**
 * Plan and optionally execute `bundletool build-apks`.
 */
export async function buildApks(
  options: BuildApksOptions
): Promise<BuildApksResult> {
  const { config, jarPath, signing, logger } = options

  if (!config.aabFile) {
    throw new Error('aab-file is required for build-apks')
  }

  const aabFile = resolveWorkspacePath(config.workingDirectory, config.aabFile)
  const apksPath = resolveApksOutputPath(
    config.workingDirectory,
    aabFile,
    config.output
  )
  const deviceSpec = config.deviceSpec
    ? resolveWorkspacePath(config.workingDirectory, config.deviceSpec)
    : undefined

  const args = buildApksArgs({
    aabFile,
    output: apksPath,
    mode: config.mode,
    deviceSpec,
    signing,
    extraArgs: config.extraArgs,
    overwrite: true
  })

  logger.info(`AAB: ${aabFile}`)
  logger.info(`APKS output: ${apksPath}`)
  if (deviceSpec) {
    logger.info(`Device spec: ${deviceSpec}`)
  }
  logger.verbose(`build-apks args: ${redactBundletoolArgs(args).join(' ')}`)

  if (config.dryRun) {
    logger.info('Dry run: skipping bundletool build-apks execution')
    return { apksPath, args, executed: false }
  }

  await ensureFileExists(aabFile, 'AAB file')
  if (deviceSpec) {
    await ensureFileExists(deviceSpec, 'Device spec')
  }
  await runBundletool({
    javaBin: config.javaBin,
    jarPath,
    args,
    cwd: config.workingDirectory,
    logger
  })

  logger.info(`Generated APK set at ${apksPath}`)
  return { apksPath, args, executed: true }
}
