import { vi } from 'vitest'
import type { ExtractApksResult } from '../src/bundletool/commands/extract-apks.js'

export const extractApks = vi.fn(
  async (): Promise<ExtractApksResult> => ({
    apksPath: '/tmp/app.apks',
    outputDir: '/tmp/out',
    args: ['extract-apks'],
    executed: false
  })
)
