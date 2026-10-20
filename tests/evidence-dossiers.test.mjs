import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { cases } from '../src/evidence/cases.js';
import { validateManifest } from '../src/evidence/schema.js';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const item = structuredClone(cases[0]);
  const dossier = {
    schemaVersion: 1, caseId: item.id,
    originalReport: { sha256: item.detection.sha256, schemaVersion: 2 },
    scan: { runStatus: 'complete', incompleteReason: null },
    finding: { file: item.detection.file, line: item.detection.line, status: item.detection.findingStatus, title: 'Test-only original finding', snippet: 'public fixture code', reportedFileSha256: 'c'.repeat(64) },
    review: { model: 'codex', family: 'openai', verdict: 'plausible', detail: 'Test-only review excerpt', omissionReason: null },
    publicSource: { url: item.sourceUrl + '#L' + item.detection.line, commit: null, sourceBytesVerified: false },
    limitations: { zh: '測試節錄，非簽章或利用成功。', en: 'Test-only excerpt; no signature or successful exploitation.' },
  };
  const bytes = JSON.stringify(dossier, null, 2) + '\n';
  item.dossier = { artifactPath: `/evidence/dossiers/${item.id}.json`, sha256: digest(bytes), runStatus: 'complete', incompleteReason: null };
  return { item, dossier, bytes };
}
async function withFiles(callback) {
  const root = await mkdtemp(join(tmpdir(), 'vettalon-dossier-'));
  try { await mkdir(join(root, 'evidence/dossiers'), { recursive: true }); await callback(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test('case metadata accepts a local case-bound dossier and rejects unsafe paths or unknown fields', () => {
  const { item } = fixture();
  assert.doesNotThrow(() => validateManifest([item]));
  for (const mutate of [d => d.artifactPath = '/evidence/dossiers/other.json', d => d.artifactPath = '/evidence/dossiers/../secret.json', d => d.sha256 = 'bad', d => d.privateTrace = 'PRIVATE_SENTINEL', d => d.runStatus = 'incomplete']) {
    const value = structuredClone(item); mutate(value.dossier); assert.throws(() => validateManifest([value]));
  }
});

test('build validates actual dossier bytes and binds case, verdict, original digest and run status', async () => {
  const { validateDossierFiles } = await import('../scripts/evidence-artifacts.mjs');
  await withFiles(async root => {
    const { item, dossier, bytes } = fixture();
    const path = join(root, item.dossier.artifactPath.slice(1));
    await writeFile(path, bytes);
    await assert.doesNotReject(() => validateDossierFiles([item], root));
    await writeFile(path, bytes + ' ');
    await assert.rejects(() => validateDossierFiles([item], root));
    for (const mutate of [d => d.caseId = 'other', d => d.originalReport.sha256 = 'd'.repeat(64), d => d.finding.status = 'candidate', d => d.finding.file = 'other.py', d => d.finding.line++, d => d.scan.runStatus = 'incomplete', d => d.privateNotes = 'PRIVATE_SENTINEL', d => d.publicSource.sourceBytesVerified = true, d => d.review.detail = '/Users/private/trace', d => d.publicSource.commit = 'e'.repeat(40)]) {
      const changed = structuredClone(dossier); mutate(changed);
      const changedBytes = JSON.stringify(changed); const changedItem = structuredClone(item);
      changedItem.dossier.sha256 = digest(changedBytes);
      await writeFile(path, changedBytes);
      await assert.rejects(() => validateDossierFiles([changedItem], root));
    }
  });
});

test('build rejects missing, oversized and symlink dossier files', async () => {
  const { validateDossierFiles } = await import('../scripts/evidence-artifacts.mjs');
  await withFiles(async root => {
    const { item } = fixture(); const path = join(root, item.dossier.artifactPath.slice(1));
    await assert.rejects(() => validateDossierFiles([item], root));
    await writeFile(path, 'x'.repeat(65537));
    await assert.rejects(() => validateDossierFiles([item], root));
    await rm(path); await writeFile(join(root, 'original.json'), '{}');
    await symlink(join(root, 'original.json'), path);
    await assert.rejects(() => validateDossierFiles([item], root));
  });
});

test('no-verdict permits only omitted error detail and preserves incomplete reason', async () => {
  const { validateDossier } = await import('../src/evidence/schema.js');
  const { item, dossier } = fixture();
  item.dossier.runStatus = 'incomplete'; item.dossier.incompleteReason = 'units_failed';
  dossier.scan = { runStatus: 'incomplete', incompleteReason: 'units_failed' };
  dossier.review = { model: 'codex', family: 'openai', verdict: 'no_verdict', detail: null, omissionReason: 'runtime_error_trace_excluded' };
  assert.doesNotThrow(() => validateDossier(item, dossier));
  dossier.review.detail = 'runtime error trace'; assert.throws(() => validateDossier(item, dossier));
});

test('actual public dossiers pass the same build gate and preserve the known historical states', async () => {
  const { validateDossierFiles } = await import('../scripts/evidence-artifacts.mjs');
  await assert.doesNotReject(() => validateDossierFiles(cases, new URL('../public', import.meta.url).pathname));
  const historical = cases.filter(item => item.type === 'historical');
  assert.equal(historical.length, 7); assert.ok(historical.every(item => item.status === 'detected'));
  assert.equal(historical.filter(item => item.dossier).length, 2);
  assert.equal(historical.filter(item => item.benchmark).length, 5);
  const phpunit = cases.find(item => item.id.startsWith('phpunit-'));
  assert.equal(phpunit.dossier.runStatus, 'incomplete'); assert.equal(phpunit.dossier.incompleteReason, 'units_failed');
});

test('directory symlinks, malformed JSON and invalid UTF-8 fail closed', async () => {
  const { validateDossierFiles } = await import('../scripts/evidence-artifacts.mjs');
  await withFiles(async root => {
    const { item } = fixture(); const path = join(root, item.dossier.artifactPath.slice(1));
    for (const bytes of [Buffer.from('{'), Buffer.from([0xff, 0xfe])]) {
      const changed = structuredClone(item); changed.dossier.sha256 = digest(bytes); await writeFile(path, bytes);
      await assert.rejects(() => validateDossierFiles([changed], root));
    }
    await rm(join(root, 'evidence/dossiers'), { recursive: true });
    await mkdir(join(root, 'replacement')); await symlink(join(root, 'replacement'), join(root, 'evidence/dossiers'));
    await assert.rejects(() => validateDossierFiles([item], root));
  });
});
