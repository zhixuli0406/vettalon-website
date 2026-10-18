import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateDossierFiles } from './evidence-artifacts.mjs';
import { validateManifest } from '../src/evidence/schema.js';
import { cases } from '../src/evidence/cases.js';

try {
  const manifestPath = process.argv[2];
  const manifest = validateManifest(manifestPath ? JSON.parse(await readFile(manifestPath,'utf8')) : cases);
  await validateDossierFiles(manifest, fileURLToPath(new URL('../public', import.meta.url)));
  console.log('Public evidence manifest validated.');
} catch {
  // Never print rejected content: it may contain private disclosure data.
  console.error('Public evidence publication gate failed. No rejected content was emitted.');
  process.exitCode = 1;
}
