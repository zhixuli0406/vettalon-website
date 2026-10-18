import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cases } from '../src/evidence/cases.js';
import { validateManifest, validateRegression, readFilters, selectCases } from '../src/evidence/schema.js';
import { validateDossierFiles } from '../scripts/evidence-artifacts.mjs';

const item = cases.find(value => value.id === 'ammonia-ghsa-x43w-36pp-96g3');
const artifactPath = 'public' + item.regression.artifactPath;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('public ammonia report keeps upstream credit separate from scanner detection', async () => {
  const bytes = await readFile(artifactPath);
  const artifact = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  assert.equal(digest(bytes), item.regression.sha256);
  assert.doesNotThrow(() => validateManifest(cases));
  assert.doesNotThrow(() => validateRegression(item, artifact));
  assert.equal(item.type, 'reported');
  assert.equal(item.status, 'regression-verified');
  assert.equal(item.cve, null); assert.equal(item.cwe, null);
  assert.equal(item.upstreamCreditUrl, 'https://rustsec.org/advisories/RUSTSEC-2026-0373.html');
  assert.equal(item.detection, undefined);
  assert.equal(item.reproduction, undefined);
  assert.equal(artifact.scope.originalLogsPublic, false);
  assert.equal(artifact.scope.productScannerUsed, false);
  assert.deepEqual(artifact.checks.map(check => check.vulnerable), ['ok','failed','ok','ok','failed']);
  assert.ok(artifact.checks.every(check => check.fixed === 'ok'));
  assert.equal(artifact.arms.vulnerable.exitCode, 101);
  assert.equal(artifact.arms.fixed.exitCode, 0);
  assert.doesNotMatch(JSON.stringify(artifact), /\/Users\/|\/home\/|vettalon-pro|Bollard|PRIVATE_SENTINEL/);
});

test('reporting and regression facets search GHSA and RustSec without requiring a CVE', () => {
  assert.equal(readFilters('?type=reported&status=regression-verified').type, 'reported');
  for (const q of ['GHSA-x43w-36pp-96g3', 'RUSTSEC-2026-0373', 'AMMONIA']) {
    assert.deepEqual(selectCases(cases, { q, type: 'reported', status: 'regression-verified' }).map(value => value.id), [item.id]);
  }
  assert.equal(selectCases(cases, { type: 'discovery' }).length, 0);
});

test('regression schema rejects mismatched identity, policy controls and unsupported claims', async () => {
  const original = JSON.parse(await readFile(artifactPath, 'utf8'));
  for (const mutate of [
    value => value.caseId = 'other-case',
    value => value.scope.originalLogsPublic = true,
    value => value.scope.productScannerUsed = true,
    value => value.arms.fixed.version = '4.1.8',
    value => value.arms.fixed.failed = 1,
    value => value.checks[1].vulnerable = 'ok',
    value => value.checks[2].role = 'denied-policy',
    value => value.checks[4].fixed = 'failed',
    value => value.privateTrace = 'PRIVATE_SENTINEL',
  ]) {
    const changed = structuredClone(original); mutate(changed);
    assert.throws(() => validateRegression(item, changed));
  }
  for (const mutate of [
    value => value.regression.artifactPath = '/evidence/regressions/other.json',
    value => value.regression.sha256 = 'bad',
    value => value.regression.checks[1].vulnerable = 'ok',
    value => value.upstreamCreditUrl = 'https://rustsec.org/advisories/RUSTSEC-2026-0000.html',
    value => value.cve = [],
    value => value.cwe = {},
    value => value.status = 'reproduced',
  ]) {
    const changed = structuredClone(item); mutate(changed);
    assert.throws(() => validateManifest([changed]));
  }
});

test('build verifies regression bytes and rejects missing, symlinked or mutated artifacts', async () => {
  await assert.doesNotReject(() => validateDossierFiles(cases, new URL('../public', import.meta.url).pathname));
  const root = await mkdtemp(join(tmpdir(), 'vettalon-regression-'));
  try {
    const directory = join(root, 'evidence', 'regressions');
    await mkdir(directory, { recursive: true });
    const path = join(directory, `${item.id}.json`);
    await assert.rejects(() => validateDossierFiles([item], root));
    const bytes = await readFile(artifactPath);
    await writeFile(path, bytes);
    await assert.doesNotReject(() => validateDossierFiles([item], root));
    await writeFile(path, Buffer.concat([bytes, Buffer.from(' ')]));
    await assert.rejects(() => validateDossierFiles([item], root));
    await rm(path);
    await symlink(artifactPath, path);
    await assert.rejects(() => validateDossierFiles([item], root));
    await rm(path);
    const altered = JSON.parse(bytes.toString()); altered.scope.productScannerUsed = true;
    const changedBytes = Buffer.from(JSON.stringify(altered));
    const changedItem = structuredClone(item); changedItem.regression.sha256 = digest(changedBytes);
    await writeFile(path, changedBytes);
    await assert.rejects(() => validateDossierFiles([changedItem], root));
  } finally { await rm(root, { recursive: true, force: true }); }
});
