/**
 * Base error for actionable, user-facing failures.
 */
export class ActionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ActionError';
    }
}
/**
 * Invalid or incomplete action inputs.
 */
export class ConfigError extends ActionError {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
    }
}
/**
 * Missing runtime prerequisites (Java, files, etc.).
 */
export class PrerequisiteError extends ActionError {
    constructor(message) {
        super(message);
        this.name = 'PrerequisiteError';
    }
}
/**
 * Bundletool download, release lookup, or checksum failures.
 */
export class DownloadError extends ActionError {
    constructor(message) {
        super(message);
        this.name = 'DownloadError';
    }
}
