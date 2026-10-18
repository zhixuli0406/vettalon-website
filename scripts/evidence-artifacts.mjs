import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateManifest, validateDossier, validateRegression, validateOrigin } from '../src/evidence/schema.js';

const maxBytes = 64 * 1024;
function reject() { throw new Error('Public evidence dossier rejected.'); }

async function readBoundArtifact(publicRoot, category, item) {
    let directory = publicRoot;
    for (const segment of ['', 'evidence', category]) {
      directory = join(directory, segment);
      const info = await lstat(directory);
      if (!info.isDirectory() || info.isSymbolicLink()) reject();
    }
    const path = join(directory, `${item.id}.json`);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > maxBytes) reject();
    const handle = await open(path, 'r');
    let bytes;
    try {
      if (!(await handle.stat()).isFile()) reject();
      const buffer = Buffer.alloc(maxBytes + 1);
      let length = 0;
      while (length < buffer.length) {
        const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
        if (!bytesRead) break;
        length += bytesRead;
      }
      if (length > maxBytes) reject();
      bytes = buffer.subarray(0, length);
    } finally { await handle.close(); }
    const expected = item[category === 'dossiers' ? 'dossier' : category === 'regressions' ? 'regression' : 'origin'].sha256;
    if (createHash('sha256').update(bytes).digest('hex') !== expected) reject();
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

/** Check only explicitly listed public artifacts; never import private reports or logs. */
export async function validateDossierFiles(cases, publicRoot) {
  validateManifest(cases);
  for (const item of cases) {
    if (item.dossier) validateDossier(item, await readBoundArtifact(publicRoot, 'dossiers', item));
    if (item.regression) validateRegression(item, await readBoundArtifact(publicRoot, 'regressions', item));
    if (item.origin) validateOrigin(item, await readBoundArtifact(publicRoot, 'origins', item));
  }
}
