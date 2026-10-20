import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateManifest, validateDossier, validateRegression, validateOrigin, validateBenchmark, BENCHMARK_RUN } from '../src/evidence/schema.js';

const maxBytes = 64 * 1024;
function reject() { throw new Error('Public evidence dossier rejected.'); }

// Read one fixed-path JSON artifact under public/, without following symlinks,
// and bind its bytes to the expected SHA-256 before parsing.
async function readPinnedJson(publicRoot, segments, fileName, expectedSha256) {
    let directory = publicRoot;
    for (const segment of ['', ...segments]) {
      directory = join(directory, segment);
      const info = await lstat(directory);
      if (!info.isDirectory() || info.isSymbolicLink()) reject();
    }
    const path = join(directory, fileName);
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
    if (createHash('sha256').update(bytes).digest('hex') !== expectedSha256) reject();
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

async function readBoundArtifact(publicRoot, category, item) {
    const expected = item[category === 'dossiers' ? 'dossier' : category === 'regressions' ? 'regression' : 'origin'].sha256;
    return readPinnedJson(publicRoot, ['evidence', category], `${item.id}.json`, expected);
}

const benchmarkSegments = BENCHMARK_RUN.directory.split('/').filter(Boolean);

/** Check only explicitly listed public artifacts; never import private reports or logs. */
export async function validateDossierFiles(cases, publicRoot) {
  validateManifest(cases);
  for (const item of cases) {
    if (item.dossier) validateDossier(item, await readBoundArtifact(publicRoot, 'dossiers', item));
    if (item.regression) validateRegression(item, await readBoundArtifact(publicRoot, 'regressions', item));
    if (item.origin) validateOrigin(item, await readBoundArtifact(publicRoot, 'origins', item));
    if (item.benchmark) validateBenchmark(item, await readPinnedJson(publicRoot, benchmarkSegments, `${item.id}.json`, item.benchmark.sha256));
  }
  // The pre-registration is published once and pinned by digest for every benchmark case.
  if (cases.some(item => item.benchmark)) {
    const prereg = await readPinnedJson(publicRoot, benchmarkSegments, 'preregistration.json', BENCHMARK_RUN.preregistration.sha256);
    const ids = new Set(prereg.cases.map(entry => entry.id));
    for (const item of cases.filter(value => value.benchmark)) if (!ids.has(item.id)) reject();
  }
}
