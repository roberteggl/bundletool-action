/**
 * Unit tests for config redaction.
 */
import { redactConfig } from '../src/config/redact.js'
import type { ActionConfig } from '../src/config/types.js'

const baseConfig: ActionConfig = {
  command: 'build-apks',
  aabFile: 'app.aab',
  mode: 'universal',
  bundletool: {
    version: '1.18.3',
    sha256: 'a'.repeat(64)
  },
  cache: true,
  javaBin: 'java',
  signing: {
    keystore: 'release.jks',
    keystoreBase64: 'YWJj',
    keystorePassword: 'store-secret',
    keyAlias: 'upload',
    keyPassword: 'key-secret',
    signRequested: true,
    hasKeystoreMaterial: true,
    enabled: true
  },
  extractUniversalApk: true,
  keepApks: true,
  extraArgs: [],
  workingDirectory: '.',
  dryRun: true,
  verbose: false
}

describe('redactConfig', () => {
  it('redacts secrets and marks provided binary material', () => {
    const redacted = redactConfig(baseConfig)

    expect(redacted.signing).toMatchObject({
      keystorePassword: '[redacted]',
      keyPassword: '[redacted]',
      keystoreBase64: '[base64 provided]'
    })
    expect(redacted.bundletool).toMatchObject({
      sha256: '[provided]',
      version: '1.18.3'
    })
  })
})
