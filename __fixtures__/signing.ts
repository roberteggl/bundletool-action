import { vi } from 'vitest'
import type { MaterializedSigning } from '../src/signing/keystore.js'

export const materializeSigning = vi.fn(
  async (): Promise<MaterializedSigning | undefined> => undefined
)
