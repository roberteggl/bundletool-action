import * as exec from '@actions/exec'
import { BundletoolError } from '../errors.js'
import type { Logger } from '../logging/logger.js'
import { redactBundletoolArgs } from './args.js'

export interface RunBundletoolOptions {
  javaBin: string
  jarPath: string
  args: string[]
  cwd?: string
  logger: Logger
}

export interface BundletoolRunResult {
  exitCode: number
}

/**
 * Execute `java -jar bundletool.jar …` with an argument array (no shell).
 */
export async function runBundletool(
  options: RunBundletoolOptions
): Promise<BundletoolRunResult> {
  const { javaBin, jarPath, args, cwd, logger } = options
  const argv = ['-jar', jarPath, ...args]

  logger.info(
    `Running: ${javaBin} -jar ${jarPath} ${redactBundletoolArgs(args).join(' ')}`
  )

  const exitCode = await exec.exec(javaBin, argv, {
    cwd,
    ignoreReturnCode: true,
    silent: false
  })

  if (exitCode !== 0) {
    throw new BundletoolError(
      `bundletool exited with code ${exitCode}. See logs above for details.`,
      exitCode
    )
  }

  return { exitCode }
}
