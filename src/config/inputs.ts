import * as core from '@actions/core'
import { ConfigError } from '../errors.js'
import type { ActionConfig, SigningConfig } from './types.js'
import { type ConfigWarning, validateConfig } from './validate.js'

export type { ConfigWarning }

function getBooleanInput(name: string, defaultValue: boolean): boolean {
  const raw = core.getInput(name)
  if (raw === '') {
    return defaultValue
  }

  const normalized = raw.trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false
  }

  throw new ConfigError(
    `Invalid boolean for "${name}": "${raw}". Use true or false.`
  )
}

function getOptionalInput(name: string): string | undefined {
  const value = core.getInput(name).trim()
  return value === '' ? undefined : value
}

function getRequiredDefault(name: string, fallback: string): string {
  const value = core.getInput(name).trim()
  return value === '' ? fallback : value
}

function parseExtraArgs(raw: string | undefined): string[] {
  if (!raw) {
    return []
  }

  return raw
    .trim()
    .split(/\s+/)
    .filter((arg) => arg.length > 0)
}

function maskSecret(value: string | undefined): void {
  if (value) {
    core.setSecret(value)
  }
}

function buildSigningConfig(): SigningConfig {
  const keystore = getOptionalInput('keystore')
  const keystoreBase64 = getOptionalInput('keystore-base64')
  const keystorePassword = getOptionalInput('keystore-password')
  const keyAlias = getOptionalInput('key-alias')
  const keyPassword = getOptionalInput('key-password')
  const signRequested = getBooleanInput('sign', true)
  const hasKeystoreMaterial = Boolean(keystore || keystoreBase64)

  maskSecret(keystorePassword)
  maskSecret(keyPassword)
  maskSecret(keystoreBase64)

  return {
    keystore,
    keystoreBase64,
    keystorePassword,
    keyAlias,
    // Bundletool treats missing key password as keystore password; mirror that.
    keyPassword: keyPassword ?? keystorePassword,
    signRequested,
    hasKeystoreMaterial,
    enabled: signRequested && hasKeystoreMaterial
  }
}

export interface ParsedInputs {
  config: ActionConfig
  warnings: ConfigWarning[]
}

/**
 * Read action inputs, mask secrets, validate, and return typed config.
 */
export function parseInputs(): ParsedInputs {
  const config: ActionConfig = {
    command: getRequiredDefault(
      'command',
      'build-apks'
    ) as ActionConfig['command'],
    aabFile: getOptionalInput('aab-file'),
    apksFile: getOptionalInput('apks-file'),
    mode: getRequiredDefault('mode', 'universal') as ActionConfig['mode'],
    output: getOptionalInput('output'),
    outputDir: getOptionalInput('output-dir'),
    bundletool: {
      version: getRequiredDefault('bundletool-version', 'latest'),
      url: getOptionalInput('bundletool-url'),
      sha256: getOptionalInput('bundletool-sha256')
    },
    cache: getBooleanInput('cache', true),
    javaBin: getRequiredDefault('java-bin', 'java'),
    signing: buildSigningConfig(),
    deviceSpec: getOptionalInput('device-spec'),
    extractUniversalApk: getBooleanInput('extract-universal-apk', true),
    keepApks: getBooleanInput('keep-apks', true),
    extraArgs: parseExtraArgs(getOptionalInput('extra-args')),
    workingDirectory: getRequiredDefault('working-directory', '.'),
    dryRun: getBooleanInput('dry-run', false),
    verbose: getBooleanInput('verbose', false)
  }

  const warnings = validateConfig(config)
  return { config, warnings }
}
