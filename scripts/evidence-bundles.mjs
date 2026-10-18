import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateManifest } from '../src/evidence/schema.js';

const bundleNames = new Map([
  ['ammonia-ghsa-x43w-36pp-96g3', 'ammonia-paired-20261019.zip'],
  ['aiohttp-cve-2024-23334', 'aiohttp-paired-20261019.zip'],
]);
const maxBytes = 512 * 1024;
function reject() { throw new Error('Public evidence bundle rejected.'); }

/** Verify the fixed-path public bundle before publication without following symlinks. */
export async function validatePairedBundleFiles(cases, publicRoot) {
  validateManifest(cases);
  for (const item of cases.filter(value => value.pairedBundle)) {
    const bundleName = bundleNames.get(item.id);
    if (!bundleName) reject();
    let directory = publicRoot;
    for (const segment of ['evidence', 'bundles']) {
      directory = join(directory, segment);
      const info = await lstat(directory);
      if (!info.isDirectory() || info.isSymbolicLink()) reject();
    }
    if (item.pairedBundle.artifactPath !== `/evidence/bundles/${bundleName}`) reject();
    const path = join(directory, bundleName);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size < 100 || info.size > maxBytes) reject();
    const handle = await open(path, 'r');
    try {
      if (!(await handle.stat()).isFile()) reject();
      const buffer = Buffer.alloc(maxBytes + 1);
      let length = 0;
      while (length < buffer.length) {
        const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
        if (!bytesRead) break;
        length += bytesRead;
      }
      if (length !== info.size || length > maxBytes) reject();
      const bytes = buffer.subarray(0, length);
      if (bytes.subarray(0, 4).toString('hex') !== '504b0304') reject();
      if (createHash('sha256').update(bytes).digest('hex') !== item.pairedBundle.sha256) reject();
    } finally { await handle.close(); }
  }
}
