import { vi } from 'vitest'
import type { ExtractApksResult } from '../src/bundletool/commands/extract-apks.js'

export const extractApks = vi.fn(
  async (): Promise<ExtractApksResult> => ({
    apksPath: '/runner/work/app.apks',
    outputDir: '/runner/work/out',
    args: ['extract-apks'],
    executed: false
  })
)
