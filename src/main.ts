import * as core from '@actions/core'
import { extractUniversalApk } from './artifacts/universal-apk.js'
import { buildApks } from './bundletool/commands/build-apks.js'
import { extractApks } from './bundletool/commands/extract-apks.js'
import { ensureBundletool } from './bundletool/installer.js'
import { ensureJava } from './bundletool/java.js'
import { CleanupRegistry } from './cleanup.js'
import { parseInputs } from './config/inputs.js'
import { redactConfig } from './config/redact.js'
import type { ActionConfig } from './config/types.js'
import type { ConfigWarning } from './config/validate.js'
import { ActionError } from './errors.js'
import { createLogger, type Logger } from './logging/logger.js'
import { materializeSigning } from './signing/keystore.js'

function emitWarnings(logger: Logger, warnings: ConfigWarning[]): void {
  for (const warning of warnings) {
    logger.warning(warning.message)
  }
}

function logPlannedSteps(logger: Logger, config: ActionConfig): void {
  logger.info(
    'Pipeline: build-apks, universal APK extract, and device-specific extract-apks.'
  )
  logger.info(`Command: ${config.command}`)
  logger.info(`Mode: ${config.mode}`)
  logger.info(`Bundletool version: ${config.bundletool.version}`)
  logger.info(`Working directory: ${config.workingDirectory}`)
  logger.info(`Dry run: ${config.dryRun}`)
  logger.info(`Verbose: ${config.verbose}`)
  logger.info(`Cache: ${config.cache}`)

  if (config.aabFile) {
    logger.info(`AAB file: ${config.aabFile}`)
  }
  if (config.apksFile) {
    logger.info(`APKS file: ${config.apksFile}`)
  }
  if (config.output) {
    logger.info(`Output: ${config.output}`)
  }
  if (config.outputDir) {
    logger.info(`Output dir: ${config.outputDir}`)
  }
  if (config.deviceSpec) {
    logger.info(`Device spec: ${config.deviceSpec}`)
  }
  if (config.extraArgs.length > 0) {
    logger.info(`Extra args: ${config.extraArgs.join(' ')}`)
  }

  if (config.signing.enabled) {
    logger.info('Signing: enabled')
  } else if (config.signing.signRequested) {
    logger.info('Signing: requested but no keystore material was provided')
  } else {
    logger.info('Signing: disabled')
  }

  logger.verbose(
    `Resolved configuration:\n${JSON.stringify(redactConfig(config), null, 2)}`
  )

  logger.info('Planned pipeline:')
  logger.info('  1. Ensure Java is available')
  logger.info('  2. Download, verify, and cache bundletool')
  if (config.command === 'build-apks') {
    logger.info('  3. Materialize signing credentials (if enabled)')
    logger.info('  4. Run bundletool build-apks')
    if (config.extractUniversalApk && config.mode === 'universal') {
      logger.info('  5. Extract universal APK from .apks')
    }
  } else {
    logger.info('  3. Run bundletool extract-apks')
  }
  logger.info('  6. Set outputs and clean up temporary files')
}

/**
 * Main action entrypoint.
 *
 * M6 adds device-specific `extract-apks` alongside the AAB → universal APK path.
 */
export async function run(): Promise<void> {
  const cleanup = new CleanupRegistry()
  let logger = createLogger(false)

  try {
    const { config, warnings } = parseInputs()
    logger = createLogger(config.verbose)

    emitWarnings(logger, warnings)

    await logger.group('Configuration', () => {
      logPlannedSteps(logger, config)
    })

    await logger.group('Prerequisites', async () => {
      await ensureJava(config.javaBin, logger)
    })

    const installed = await logger.group('Bundletool', async () => {
      return ensureBundletool(config.bundletool, {
        cache: config.cache,
        dryRun: config.dryRun,
        logger
      })
    })

    core.setOutput('bundletool-version', installed.version)
    if (installed.jarPath) {
      core.setOutput('bundletool-path', installed.jarPath)
    }

    if (!installed.jarPath && !config.dryRun) {
      throw new ActionError('Bundletool JAR path is missing after install.')
    }

    const jarPath = installed.jarPath ?? 'bundletool.jar'

    if (config.command === 'extract-apks') {
      const extractResult = await logger.group('extract-apks', async () => {
        return extractApks({
          config,
          jarPath,
          logger
        })
      })

      core.setOutput('apks-path', extractResult.apksPath)
      core.setOutput('output-dir', extractResult.outputDir)

      if (config.dryRun) {
        logger.notice(
          'Dry run complete - extract-apks was planned but not executed.'
        )
        return
      }

      logger.notice(`Device APKs ready in ${extractResult.outputDir}`)
      return
    }

    const signing = await logger.group('Signing', async () => {
      return materializeSigning(config.signing, {
        workingDirectory: config.workingDirectory,
        dryRun: config.dryRun,
        cleanup,
        logger
      })
    })

    if (signing) {
      logger.verbose(`Keystore ready at ${signing.keystorePath}`)
      logger.verbose(`Key alias: ${signing.keyAlias}`)
    }

    const buildResult = await logger.group('build-apks', async () => {
      return buildApks({
        config,
        jarPath,
        signing,
        logger
      })
    })

    const extractResult = await logger.group(
      'Extract universal APK',
      async () => {
        return extractUniversalApk({
          config,
          apksPath: buildResult.apksPath,
          logger
        })
      }
    )

    if (!extractResult?.apksDeleted) {
      core.setOutput('apks-path', buildResult.apksPath)
    }

    if (extractResult) {
      core.setOutput('apk-path', extractResult.apkPath)
      if (config.outputDir) {
        core.setOutput('output-dir', config.outputDir)
      }
    }

    if (config.dryRun) {
      logger.notice(
        'Dry run complete - build-apks and extraction were planned but not executed.'
      )
      return
    }

    if (extractResult?.extracted) {
      logger.notice(`Universal APK ready at ${extractResult.apkPath}`)
    } else {
      logger.notice(`APK set ready at ${buildResult.apksPath}`)
    }
  } catch (error) {
    if (error instanceof ActionError || error instanceof Error) {
      core.setFailed(error.message)
      return
    }

    core.setFailed(`Unexpected error: ${String(error)}`)
  } finally {
    await cleanup.cleanup(logger)
  }
}
