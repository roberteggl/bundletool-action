import { vi } from 'vitest'
import type { BuildApksResult } from '../src/bundletool/commands/build-apks.js'

export const buildApks = vi.fn(
  async (): Promise<BuildApksResult> => ({
    apksPath: '/runner/work/app.apks',
    args: ['build-apks'],
    executed: false
  })
)
