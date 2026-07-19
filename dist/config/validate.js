import { ConfigError } from '../errors.js';
import { BUILD_MODES, BUNDLETOOL_COMMANDS, RESERVED_EXTRA_FLAGS, SHA256_PATTERN, VERSION_PATTERN } from './constants.js';
function assertCommand(value) {
    if (!BUNDLETOOL_COMMANDS.includes(value)) {
        throw new ConfigError(`Invalid command "${value}". Supported values: ${BUNDLETOOL_COMMANDS.join(', ')}.`);
    }
}
function assertMode(value) {
    if (!BUILD_MODES.includes(value)) {
        throw new ConfigError(`Invalid mode "${value}". Supported values: ${BUILD_MODES.join(', ')}.`);
    }
}
function assertSha256(value) {
    if (!value) {
        return;
    }
    if (!SHA256_PATTERN.test(value)) {
        throw new ConfigError('Input "bundletool-sha256" must be a 64-character hexadecimal SHA-256 digest.');
    }
}
function assertVersion(version) {
    if (version === 'latest') {
        return;
    }
    if (!VERSION_PATTERN.test(version)) {
        throw new ConfigError(`Invalid bundletool-version "${version}". Use "latest" or a release tag like "1.18.3".`);
    }
}
function assertUrl(url) {
    if (!url) {
        return;
    }
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new ConfigError(`Invalid bundletool-url "${url}".`);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new ConfigError(`Invalid bundletool-url protocol "${parsed.protocol}". Use http: or https:.`);
    }
}
function assertExtraArgs(extraArgs) {
    for (const arg of extraArgs) {
        const flag = arg.split('=')[0];
        if (RESERVED_EXTRA_FLAGS.includes(flag)) {
            throw new ConfigError(`extra-args must not include reserved flag "${flag}". Use the dedicated action input instead.`);
        }
    }
}
function assertSigning(signing) {
    const warnings = [];
    if (signing.keystore && signing.keystoreBase64) {
        throw new ConfigError('Provide either "keystore" or "keystore-base64", not both.');
    }
    if (!signing.signRequested && signing.hasKeystoreMaterial) {
        warnings.push({
            message: 'A keystore was provided but sign=false. Keystore inputs will be ignored.'
        });
    }
    if (signing.enabled) {
        if (!signing.keystorePassword) {
            throw new ConfigError('Input "keystore-password" is required when signing is enabled.');
        }
        if (!signing.keyAlias) {
            throw new ConfigError('Input "key-alias" is required when signing is enabled.');
        }
    }
    return warnings;
}
function assertCommandRequirements(config) {
    if (config.command === 'build-apks' && !config.aabFile) {
        throw new ConfigError('Input "aab-file" is required when command is "build-apks".');
    }
    if (config.command === 'extract-apks') {
        if (!config.deviceSpec) {
            throw new ConfigError('Input "device-spec" is required when command is "extract-apks".');
        }
        if (!config.output && !config.outputDir) {
            throw new ConfigError('Provide "output" or "output-dir" when command is "extract-apks".');
        }
    }
}
/**
 * Validate configuration and return non-fatal warnings.
 */
export function validateConfig(config) {
    assertCommand(config.command);
    assertMode(config.mode);
    assertVersion(config.bundletool.version);
    assertUrl(config.bundletool.url);
    assertSha256(config.bundletool.sha256);
    assertExtraArgs(config.extraArgs);
    assertCommandRequirements(config);
    const warnings = assertSigning(config.signing);
    if (config.command === 'build-apks' &&
        config.mode !== 'universal' &&
        config.extractUniversalApk) {
        warnings.push({
            message: `extract-universal-apk=true has no effect when mode is "${config.mode}".`
        });
    }
    if (config.workingDirectory.trim() === '') {
        throw new ConfigError('Input "working-directory" must not be empty.');
    }
    if (config.javaBin.trim() === '') {
        throw new ConfigError('Input "java-bin" must not be empty.');
    }
    return warnings;
}
