import type { ActionConfig } from './types.js'

/**
 * Return a log-safe view of the configuration with secrets redacted.
 */
export function redactConfig(config: ActionConfig): Record<string, unknown> {
  return {
    command: config.command,
    aabFile: config.aabFile,
    mode: config.mode,
    output: config.output,
    outputDir: config.outputDir,
    bundletool: {
      version: config.bundletool.version,
      url: config.bundletool.url,
      sha256: config.bundletool.sha256 ? '[provided]' : undefined
    },
    cache: config.cache,
    javaBin: config.javaBin,
    signing: {
      enabled: config.signing.enabled,
      signRequested: config.signing.signRequested,
      hasKeystoreMaterial: config.signing.hasKeystoreMaterial,
      keystore: config.signing.keystore,
      keystoreBase64: config.signing.keystoreBase64
        ? '[base64 provided]'
        : undefined,
      keyAlias: config.signing.keyAlias,
      keystorePassword: config.signing.keystorePassword
        ? '[redacted]'
        : undefined,
      keyPassword: config.signing.keyPassword ? '[redacted]' : undefined
    },
    deviceSpec: config.deviceSpec,
    extractUniversalApk: config.extractUniversalApk,
    keepApks: config.keepApks,
    extraArgs: config.extraArgs,
    workingDirectory: config.workingDirectory,
    dryRun: config.dryRun,
    verbose: config.verbose
  }
}
