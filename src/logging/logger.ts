import * as core from '@actions/core'

export interface Logger {
  info(message: string): void
  notice(message: string): void
  warning(message: string): void
  error(message: string): void
  debug(message: string): void
  verbose(message: string): void
  group<T>(name: string, fn: () => Promise<T> | T): Promise<T>
}

/**
 * Thin wrapper around @actions/core logging with a verbose gate.
 */
export function createLogger(verbose: boolean): Logger {
  return {
    info(message: string): void {
      core.info(message)
    },
    notice(message: string): void {
      core.notice(message)
    },
    warning(message: string): void {
      core.warning(message)
    },
    error(message: string): void {
      core.error(message)
    },
    debug(message: string): void {
      core.debug(message)
    },
    verbose(message: string): void {
      if (verbose) {
        core.info(`[verbose] ${message}`)
      } else {
        core.debug(message)
      }
    },
    async group<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
      core.startGroup(name)
      try {
        return await fn()
      } finally {
        core.endGroup()
      }
    }
  }
}
