import * as exec from '@actions/exec';
import { PrerequisiteError } from '../errors.js';
/**
 * Ensure the configured Java binary is available on PATH.
 */
export async function ensureJava(javaBin, logger) {
    logger.verbose(`Checking Java executable: ${javaBin}`);
    try {
        await exec.exec(javaBin, ['-version'], {
            silent: true,
            failOnStdErr: false
        });
    }
    catch {
        throw new PrerequisiteError(`Java was not found ("${javaBin} -version" failed). Install Java or set "java-bin", e.g. via actions/setup-java.`);
    }
    logger.info(`Java is available (${javaBin})`);
}
