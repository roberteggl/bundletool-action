import { vi } from 'vitest'
import type { UniversalApkResult } from '../src/artifacts/universal-apk.js'

export const extractUniversalApk = vi.fn(
  async (): Promise<UniversalApkResult | undefined> => ({
    apkPath: '/runner/work/app.apk',
    extracted: false,
    apksDeleted: false
  })
)
