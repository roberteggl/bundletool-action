import * as path from 'node:path';
import * as tc from '@actions/tool-cache';
import { resolveRelease } from './release-client.js';
import { verifySha256 } from './sha256.js';
const TOOL_NAME = 'bundletool';
const JAR_NAME = 'bundletool.jar';
async function jarFromCache(version) {
    const cachedDir = tc.find(TOOL_NAME, version);
    if (!cachedDir) {
        return undefined;
    }
    return path.join(cachedDir, JAR_NAME);
}
async function downloadAndMaybeCache(release, cache, logger) {
    logger.info(`Downloading bundletool from ${release.downloadUrl}`);
    const downloadPath = await tc.downloadTool(release.downloadUrl);
    if (!cache) {
        logger.verbose('Caching disabled; using downloaded JAR directly');
        return { jarPath: downloadPath, fromCache: false };
    }
    logger.verbose(`Caching bundletool ${release.version}`);
    const cachedDir = await tc.cacheFile(downloadPath, JAR_NAME, TOOL_NAME, release.version);
    return {
        jarPath: path.join(cachedDir, JAR_NAME),
        fromCache: false
    };
}
/**
 * Resolve, download, verify, and cache the bundletool JAR.
 */
export async function ensureBundletool(source, options) {
    const { cache, dryRun, logger } = options;
    const release = await resolveRelease(source, logger);
    if (dryRun) {
        logger.info(`Dry run: would install bundletool ${release.version} from ${release.downloadUrl}`);
        return {
            version: release.version,
            downloadUrl: release.downloadUrl,
            fromCache: false,
            dryRun: true
        };
    }
    if (cache) {
        const cachedJar = await jarFromCache(release.version);
        if (cachedJar) {
            logger.info(`Using cached bundletool ${release.version} at ${cachedJar}`);
            if (source.sha256) {
                await verifySha256(cachedJar, source.sha256);
                logger.verbose('Cached JAR SHA-256 verified');
            }
            return {
                version: release.version,
                jarPath: cachedJar,
                downloadUrl: release.downloadUrl,
                fromCache: true,
                dryRun: false
            };
        }
    }
    const installed = await downloadAndMaybeCache(release, cache, logger);
    if (source.sha256) {
        await verifySha256(installed.jarPath, source.sha256);
        logger.info('Downloaded JAR SHA-256 verified');
    }
    else {
        logger.verbose('No bundletool-sha256 provided; skipping checksum verification');
    }
    logger.info(`Bundletool ready at ${installed.jarPath}`);
    return {
        version: release.version,
        jarPath: installed.jarPath,
        downloadUrl: release.downloadUrl,
        fromCache: installed.fromCache,
        dryRun: false
    };
}
