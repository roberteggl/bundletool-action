import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { DownloadError } from '../errors.js';
/**
 * Compute the SHA-256 hex digest of a file.
 */
export async function sha256File(filePath) {
    return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        const stream = createReadStream(filePath);
        stream.on('error', reject);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}
/**
 * Verify a file matches the expected SHA-256 digest.
 */
export async function verifySha256(filePath, expected) {
    const actual = await sha256File(filePath);
    if (actual.toLowerCase() !== expected.toLowerCase()) {
        throw new DownloadError(`SHA-256 mismatch for ${filePath}. Expected ${expected.toLowerCase()}, got ${actual.toLowerCase()}.`);
    }
}
