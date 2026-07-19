import type { BuildMode } from '../config/types.js'
import type { MaterializedSigning } from '../signing/keystore.js'

export interface BuildApksArgOptions {
  aabFile: string
  output: string
  mode: BuildMode
  deviceSpec?: string
  signing?: MaterializedSigning
  extraArgs: string[]
  overwrite?: boolean
}

export interface ExtractApksArgOptions {
  apksFile: string
  outputDir: string
  deviceSpec: string
  extraArgs: string[]
}

/**
 * Build argv for `bundletool build-apks`.
 *
 * Known flags are emitted first; `extraArgs` are appended last.
 */
export function buildApksArgs(options: BuildApksArgOptions): string[] {
  const args = [
    'build-apks',
    `--bundle=${options.aabFile}`,
    `--output=${options.output}`,
    `--mode=${options.mode}`
  ]

  if (options.overwrite !== false) {
    args.push('--overwrite')
  }

  if (options.deviceSpec) {
    args.push(`--device-spec=${options.deviceSpec}`)
  }

  if (options.signing) {
    args.push(
      `--ks=${options.signing.keystorePath}`,
      `--ks-pass=file:${options.signing.keystorePasswordFile}`,
      `--ks-key-alias=${options.signing.keyAlias}`,
      `--key-pass=file:${options.signing.keyPasswordFile}`
    )
  }

  args.push(...options.extraArgs)
  return args
}

/**
 * Build argv for `bundletool extract-apks`.
 */
export function buildExtractApksArgs(options: ExtractApksArgOptions): string[] {
  return [
    'extract-apks',
    `--apks=${options.apksFile}`,
    `--output-dir=${options.outputDir}`,
    `--device-spec=${options.deviceSpec}`,
    ...options.extraArgs
  ]
}

/**
 * Redact password-file paths in argv for safe logging.
 */
export function redactBundletoolArgs(args: string[]): string[] {
  return args.map((arg) => {
    if (
      arg.startsWith('--ks-pass=file:') ||
      arg.startsWith('--key-pass=file:')
    ) {
      const prefix = arg.slice(0, arg.indexOf('=') + 1)
      return `${prefix}file:[redacted]`
    }
    return arg
  })
}
