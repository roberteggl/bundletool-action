import * as core from '@actions/core';
import { ConfigError } from '../errors.js';
import { validateConfig } from './validate.js';
function getBooleanInput(name, defaultValue) {
    const raw = core.getInput(name);
    if (raw === '') {
        return defaultValue;
    }
    const normalized = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
        return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
        return false;
    }
    throw new ConfigError(`Invalid boolean for "${name}": "${raw}". Use true or false.`);
}
function getOptionalInput(name) {
    const value = core.getInput(name).trim();
    return value === '' ? undefined : value;
}
function getRequiredDefault(name, fallback) {
    const value = core.getInput(name).trim();
    return value === '' ? fallback : value;
}
function parseExtraArgs(raw) {
    if (!raw) {
        return [];
    }
    return raw
        .trim()
        .split(/\s+/)
        .filter((arg) => arg.length > 0);
}
function maskSecret(value) {
    if (value) {
        core.setSecret(value);
    }
}
function buildSigningConfig() {
    const keystore = getOptionalInput('keystore');
    const keystoreBase64 = getOptionalInput('keystore-base64');
    const keystorePassword = getOptionalInput('keystore-password');
    const keyAlias = getOptionalInput('key-alias');
    const keyPassword = getOptionalInput('key-password');
    const signRequested = getBooleanInput('sign', true);
    const hasKeystoreMaterial = Boolean(keystore || keystoreBase64);
    maskSecret(keystorePassword);
    maskSecret(keyPassword);
    maskSecret(keystoreBase64);
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
    };
}
/**
 * Read action inputs, mask secrets, validate, and return typed config.
 */
export function parseInputs() {
    const config = {
        command: getRequiredDefault('command', 'build-apks'),
        aabFile: getOptionalInput('aab-file'),
        mode: getRequiredDefault('mode', 'universal'),
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
    };
    const warnings = validateConfig(config);
    return { config, warnings };
}
