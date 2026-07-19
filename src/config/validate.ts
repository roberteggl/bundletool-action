import { ConfigError } from '../errors.js'
import {
  BUILD_MODES,
  BUNDLETOOL_COMMANDS,
  RESERVED_EXTRA_FLAGS,
  SHA256_PATTERN,
  VERSION_PATTERN
} from './constants.js'
import type {
  ActionConfig,
  BuildMode,
  BundletoolCommand,
  SigningConfig
} from './types.js'

export interface ConfigWarning {
  message: string
}

function assertCommand(value: string): asserts value is BundletoolCommand {
  if (!(BUNDLETOOL_COMMANDS as readonly string[]).includes(value)) {
    throw new ConfigError(
      `Invalid command "${value}". Supported values: ${BUNDLETOOL_COMMANDS.join(', ')}.`
    )
  }
}

function assertMode(value: string): asserts value is BuildMode {
  if (!(BUILD_MODES as readonly string[]).includes(value)) {
    throw new ConfigError(
      `Invalid mode "${value}". Supported values: ${BUILD_MODES.join(', ')}.`
    )
  }
}

function assertSha256(value: string | undefined): void {
  if (!value) {
    return
  }

  if (!SHA256_PATTERN.test(value)) {
    throw new ConfigError(
      'Input "bundletool-sha256" must be a 64-character hexadecimal SHA-256 digest.'
    )
  }
}

function assertVersion(version: string): void {
  if (version === 'latest') {
    return
  }

  if (!VERSION_PATTERN.test(version)) {
    throw new ConfigError(
      `Invalid bundletool-version "${version}". Use "latest" or a release tag like "1.18.3".`
    )
  }
}

function assertUrl(url: string | undefined): void {
  if (!url) {
    return
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new ConfigError(`Invalid bundletool-url "${url}".`)
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ConfigError(
      `Invalid bundletool-url protocol "${parsed.protocol}". Use http: or https:.`
    )
  }
}

function assertExtraArgs(extraArgs: string[]): void {
  for (const arg of extraArgs) {
    const flag = arg.split('=')[0]
    if ((RESERVED_EXTRA_FLAGS as readonly string[]).includes(flag)) {
      throw new ConfigError(
        `extra-args must not include reserved flag "${flag}". Use the dedicated action input instead.`
      )
    }
  }
}

function assertSigning(signing: SigningConfig): ConfigWarning[] {
  const warnings: ConfigWarning[] = []

  if (signing.keystore && signing.keystoreBase64) {
    throw new ConfigError(
      'Provide either "keystore" or "keystore-base64", not both.'
    )
  }

  if (!signing.signRequested && signing.hasKeystoreMaterial) {
    warnings.push({
      message:
        'A keystore was provided but sign=false. Keystore inputs will be ignored.'
    })
  }

  if (signing.enabled) {
    if (!signing.keystorePassword) {
      throw new ConfigError(
        'Input "keystore-password" is required when signing is enabled.'
      )
    }
    if (!signing.keyAlias) {
      throw new ConfigError(
        'Input "key-alias" is required when signing is enabled.'
      )
    }
  }

  return warnings
}

function assertCommandRequirements(config: ActionConfig): void {
  if (config.command === 'build-apks' && !config.aabFile) {
    throw new ConfigError(
      'Input "aab-file" is required when command is "build-apks".'
    )
  }

  if (config.command === 'extract-apks') {
    if (!config.apksFile) {
      throw new ConfigError(
        'Input "apks-file" is required when command is "extract-apks".'
      )
    }
    if (!config.deviceSpec) {
      throw new ConfigError(
        'Input "device-spec" is required when command is "extract-apks".'
      )
    }
    if (!config.outputDir && !config.output) {
      throw new ConfigError(
        'Provide "output-dir" (or "output") when command is "extract-apks".'
      )
    }
  }
}

/**
 * Validate configuration and return non-fatal warnings.
 */
export function validateConfig(config: ActionConfig): ConfigWarning[] {
  assertCommand(config.command)
  assertMode(config.mode)
  assertVersion(config.bundletool.version)
  assertUrl(config.bundletool.url)
  assertSha256(config.bundletool.sha256)
  assertExtraArgs(config.extraArgs)
  assertCommandRequirements(config)

  const warnings = assertSigning(config.signing)

  if (
    config.command === 'build-apks' &&
    config.mode !== 'universal' &&
    config.extractUniversalApk
  ) {
    warnings.push({
      message: `extract-universal-apk=true has no effect when mode is "${config.mode}".`
    })
  }

  if (
    config.command === 'build-apks' &&
    config.deviceSpec &&
    config.mode === 'universal'
  ) {
    warnings.push({
      message:
        'device-spec is set with mode=universal. Bundletool will receive both flags; prefer mode=default for device-targeted builds.'
    })
  }

  if (config.command === 'extract-apks' && config.extractUniversalApk) {
    warnings.push({
      message:
        'extract-universal-apk is ignored when command is "extract-apks".'
    })
  }

  if (config.workingDirectory.trim() === '') {
    throw new ConfigError('Input "working-directory" must not be empty.')
  }

  if (config.javaBin.trim() === '') {
    throw new ConfigError('Input "java-bin" must not be empty.')
  }

  return warnings
}
