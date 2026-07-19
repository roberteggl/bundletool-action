import { vi } from 'vitest'
import type { InstalledBundletool } from '../src/bundletool/installer.js'

export const ensureBundletool = vi.fn(
  async (): Promise<InstalledBundletool> => ({
    version: '1.18.3',
    downloadUrl:
      'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar',
    fromCache: false,
    dryRun: true
  })
)
