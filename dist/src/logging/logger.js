import * as core from '@actions/core';
/**
 * Thin wrapper around @actions/core logging with a verbose gate.
 */
export function createLogger(verbose) {
    return {
        info(message) {
            core.info(message);
        },
        notice(message) {
            core.notice(message);
        },
        warning(message) {
            core.warning(message);
        },
        error(message) {
            core.error(message);
        },
        debug(message) {
            core.debug(message);
        },
        verbose(message) {
            if (verbose) {
                core.info(`[verbose] ${message}`);
            }
            else {
                core.debug(message);
            }
        },
        async group(name, fn) {
            core.startGroup(name);
            try {
                return await fn();
            }
            finally {
                core.endGroup();
            }
        }
    };
}
