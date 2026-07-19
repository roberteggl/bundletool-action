import * as io from '@actions/io'
import type { Logger } from './logging/logger.js'

/**
 * Tracks temporary paths created by the action and removes them on cleanup.
 */
export class CleanupRegistry {
  private readonly paths = new Set<string>()

  register(targetPath: string): void {
    this.paths.add(targetPath)
  }

  async cleanup(logger: Logger): Promise<void> {
    const targets = [...this.paths].reverse()
    this.paths.clear()

    for (const target of targets) {
      try {
        await io.rmRF(target)
        logger.verbose(`Cleaned up ${target}`)
      } catch (error) {
        logger.warning(
          `Failed to clean up ${target}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }
}
