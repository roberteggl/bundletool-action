import * as core from '@actions/core';
import { ensureBundletool } from './bundletool/installer.js';
import { ensureJava } from './bundletool/java.js';
import { parseInputs } from './config/inputs.js';
import { redactConfig } from './config/redact.js';
import { ActionError } from './errors.js';
import { createLogger } from './logging/logger.js';
function emitWarnings(logger, warnings) {
    for (const warning of warnings) {
        logger.warning(warning.message);
    }
}
function logPlannedSteps(logger, config) {
    logger.info('Milestone 2 — bundletool install; build/sign pending M3–M5.');
    logger.info(`Command: ${config.command}`);
    logger.info(`Mode: ${config.mode}`);
    logger.info(`Bundletool version: ${config.bundletool.version}`);
    logger.info(`Working directory: ${config.workingDirectory}`);
    logger.info(`Dry run: ${config.dryRun}`);
    logger.info(`Verbose: ${config.verbose}`);
    logger.info(`Cache: ${config.cache}`);
    if (config.aabFile) {
        logger.info(`AAB file: ${config.aabFile}`);
    }
    if (config.output) {
        logger.info(`Output: ${config.output}`);
    }
    if (config.outputDir) {
        logger.info(`Output dir: ${config.outputDir}`);
    }
    if (config.deviceSpec) {
        logger.info(`Device spec: ${config.deviceSpec}`);
    }
    if (config.extraArgs.length > 0) {
        logger.info(`Extra args: ${config.extraArgs.join(' ')}`);
    }
    if (config.signing.enabled) {
        logger.info('Signing: enabled (keystore will be materialized in a later milestone)');
    }
    else if (config.signing.signRequested) {
        logger.info('Signing: requested but no keystore material was provided');
    }
    else {
        logger.info('Signing: disabled');
    }
    logger.verbose(`Resolved configuration:\n${JSON.stringify(redactConfig(config), null, 2)}`);
    logger.info('Planned pipeline:');
    logger.info('  1. Ensure Java is available');
    logger.info('  2. Download, verify, and cache bundletool');
    logger.info('  3. Materialize signing credentials (if enabled)');
    logger.info(`  4. Run bundletool ${config.command}`);
    if (config.extractUniversalApk && config.mode === 'universal') {
        logger.info('  5. Extract universal APK from .apks');
    }
    logger.info('  6. Set outputs and clean up temporary files');
}
/**
 * Main action entrypoint.
 *
 * M2 installs (or dry-run resolves) bundletool. Later milestones implement
 * signing, execution, and artifact extraction.
 */
export async function run() {
    try {
        const { config, warnings } = parseInputs();
        const logger = createLogger(config.verbose);
        emitWarnings(logger, warnings);
        await logger.group('Configuration', () => {
            logPlannedSteps(logger, config);
        });
        await logger.group('Prerequisites', async () => {
            await ensureJava(config.javaBin, logger);
        });
        const installed = await logger.group('Bundletool', async () => {
            return ensureBundletool(config.bundletool, {
                cache: config.cache,
                dryRun: config.dryRun,
                logger
            });
        });
        core.setOutput('bundletool-version', installed.version);
        if (installed.jarPath) {
            core.setOutput('bundletool-path', installed.jarPath);
        }
        if (config.dryRun) {
            logger.notice('Dry run complete — bundletool was resolved but not downloaded.');
            return;
        }
        logger.warning('APK generation is not implemented yet (M2). Signing and build-apks land in M3–M5.');
    }
    catch (error) {
        if (error instanceof ActionError || error instanceof Error) {
            core.setFailed(error.message);
            return;
        }
        core.setFailed(`Unexpected error: ${String(error)}`);
    }
}
