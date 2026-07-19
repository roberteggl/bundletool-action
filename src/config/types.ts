import type { BUILD_MODES, BUNDLETOOL_COMMANDS } from './constants.js'

export type BundletoolCommand = (typeof BUNDLETOOL_COMMANDS)[number]
export type BuildMode = (typeof BUILD_MODES)[number]

export interface BundletoolSource {
  version: string
  url?: string
  sha256?: string
}

export interface SigningConfig {
  keystore?: string
  keystoreBase64?: string
  keystorePassword?: string
  keyAlias?: string
  keyPassword?: string
  /** User asked to sign (sign input). */
  signRequested: boolean
  /** Keystore path or base64 was provided. */
  hasKeystoreMaterial: boolean
  /** Effective signing: requested and material present. */
  enabled: boolean
}

/**
 * Fully parsed and validated action configuration.
 */
export interface ActionConfig {
  command: BundletoolCommand
  aabFile?: string
  apksFile?: string
  mode: BuildMode
  output?: string
  outputDir?: string
  bundletool: BundletoolSource
  cache: boolean
  javaBin: string
  signing: SigningConfig
  deviceSpec?: string
  extractUniversalApk: boolean
  keepApks: boolean
  extraArgs: string[]
  workingDirectory: string
  dryRun: boolean
  verbose: boolean
}
