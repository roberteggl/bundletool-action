/**
 * Base error for actionable, user-facing failures.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionError'
  }
}

/**
 * Invalid or incomplete action inputs.
 */
export class ConfigError extends ActionError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

/**
 * Missing runtime prerequisites (Java, files, etc.).
 */
export class PrerequisiteError extends ActionError {
  constructor(message: string) {
    super(message)
    this.name = 'PrerequisiteError'
  }
}

/**
 * Bundletool download, release lookup, or checksum failures.
 */
export class DownloadError extends ActionError {
  constructor(message: string) {
    super(message)
    this.name = 'DownloadError'
  }
}

/**
 * Keystore decoding or signing credential materialization failures.
 */
export class SigningError extends ActionError {
  constructor(message: string) {
    super(message)
    this.name = 'SigningError'
  }
}

/**
 * Bundletool process execution failures.
 */
export class BundletoolError extends ActionError {
  readonly exitCode?: number

  constructor(message: string, exitCode?: number) {
    super(message)
    this.name = 'BundletoolError'
    this.exitCode = exitCode
  }
}

/**
 * Artifact post-processing failures (zip extract, missing universal.apk, etc.).
 */
export class ArtifactError extends ActionError {
  constructor(message: string) {
    super(message)
    this.name = 'ArtifactError'
  }
}
