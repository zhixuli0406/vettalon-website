import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, cp, copyFile, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cases } from '../src/evidence/cases.js';
import { validatePairedBundleFiles } from '../scripts/evidence-bundles.mjs';

const item = cases.find(value => value.id === 'ammonia-ghsa-x43w-36pp-96g3');
const publicPath = 'public' + item.pairedBundle.artifactPath;
const extract = `import pathlib,sys,zipfile
root=pathlib.Path(sys.argv[1]); bundle=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(bundle) as archive:
    names=archive.namelist()
    assert len(names)==len(set(names))==17
    assert all(not name.startswith('/') and '..' not in pathlib.PurePosixPath(name).parts for name in names)
    assert all((member.external_attr >> 16) & 0o170000 == 0o100000 for member in archive.infolist())
    archive.extractall(root)
`;

test('downloadable ZIP is deterministic, pinned and independently verifies after extraction', async () => {
  const pack = spawnSync('python3', ['-B','-I','-S','scripts/package-ammonia-evidence.py','--check'], { encoding: 'utf8' });
  assert.equal(pack.status, 0, pack.stderr);
  const bytes = await readFile(publicPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.pairedBundle.sha256);
  await assert.doesNotReject(() => validatePairedBundleFiles(cases, 'public'));
  const root = await mkdtemp(join(tmpdir(), 'ammonia-public-bundle-'));
  try {
    const unpack = spawnSync('python3', ['-B','-I','-S','-c', extract, root, publicPath], { encoding: 'utf8' });
    assert.equal(unpack.status, 0, unpack.stderr);
    const verify = spawnSync('python3', ['-B','-I','-S','reports/evidence-acceptance/ammonia-paired-20261019/verify.py'], { cwd: root, encoding: 'utf8' });
    assert.equal(verify.status, 0, verify.stderr);
    assert.equal(JSON.parse(verify.stdout).status, 'verified');
    const tests = spawnSync('python3', ['-B','-I','-S','-m','unittest','discover','-s','reports/evidence-acceptance/ammonia-paired-20261019','-p','test_*.py'], { cwd: root, encoding: 'utf8' });
    assert.equal(tests.status, 0, tests.stderr);
    assert.match(tests.stderr, /Ran 16 tests/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('publication gate rejects missing, changed and symlinked bundle', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ammonia-bundle-gate-'));
  try {
    const directory = join(root, 'evidence', 'bundles');
    await mkdir(directory, { recursive: true });
    await assert.rejects(() => validatePairedBundleFiles([item], root));
    const path = join(directory, 'ammonia-paired-20261019.zip');
    const bytes = await readFile(publicPath);
    await writeFile(path, bytes);
    await assert.doesNotReject(() => validatePairedBundleFiles([item], root));
    await writeFile(path, Buffer.concat([bytes, Buffer.from('x')]));
    await assert.rejects(() => validatePairedBundleFiles([item], root));
    await rm(path);
    await symlink(publicPath, path);
    await assert.rejects(() => validatePairedBundleFiles([item], root));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('standalone build command runs package inventory and extracted verifier before Vite', async () => {
  const packageFile = JSON.parse(await readFile('package.json', 'utf8'));
  assert.match(packageFile.scripts.build, /^python3 -B -I -S scripts\/package-ammonia-evidence\.py --check && python3 -B -I -S scripts\/validate-ammonia-bundle\.py && node scripts\/validate-evidence\.mjs && vite build/);
  const gate = spawnSync('python3', ['-B','-I','-S','scripts/validate-ammonia-bundle.py'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(gate.status, 0, gate.stderr);
});

test('ZIP gate rejects injected member and re-packed receipt despite matching source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ammonia-bundle-negative-'));
  try {
    await mkdir(join(root, 'scripts'));
    await copyFile('scripts/package-ammonia-evidence.py', join(root, 'scripts/package-ammonia-evidence.py'));
    await cp('evidence-bundles/ammonia-paired-20261019', join(root, 'evidence-bundles/ammonia-paired-20261019'), { recursive: true });
    const target = join(root, 'public/evidence/bundles');
    await mkdir(target, { recursive: true });
    await copyFile(publicPath, join(target, 'ammonia-paired-20261019.zip'));
    const gate = () => spawnSync('python3', ['-B','-I','-S','scripts/validate-ammonia-bundle.py','--root',root], { encoding: 'utf8', timeout: 15000 });
    assert.equal(gate().status, 0);

    const inject = `from pathlib import Path
from zipfile import ZipFile
import sys
path=Path(sys.argv[1])
with ZipFile(path) as source:
    contents=[(item,source.read(item)) for item in source.infolist()]
with ZipFile(path,'w') as output:
    for item,raw in contents:
        output.writestr(item,raw)
    output.writestr('../leak.txt',b'not-public')
`;
    const zip = join(target, 'ammonia-paired-20261019.zip');
    assert.equal(spawnSync('python3', ['-B','-I','-S','-c',inject,zip]).status, 0);
    assert.equal(gate().status, 1, 'unexpected ZIP member must fail before extraction');

    const stagedReceipt = join(root, 'evidence-bundles/ammonia-paired-20261019/reports/evidence-acceptance/ammonia-paired-20261019/receipt.json');
    const receipt = JSON.parse(await readFile(stagedReceipt, 'utf8'));
    receipt.status = 'incomplete';
    await writeFile(stagedReceipt, JSON.stringify(receipt));
    const repack = spawnSync('python3', ['-B','-I','-S','scripts/package-ammonia-evidence.py'], { cwd: root, encoding: 'utf8' });
    assert.equal(repack.status, 0, repack.stderr);
    assert.equal(gate().status, 1, 'same-source repack with invalid receipt must fail offline verifier');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('standalone npm build fails before Vite on re-pinned ZIP tampering and invalid re-packed receipt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ammonia-build-negative-'));
  try {
    await copyFile('package.json', join(root, 'package.json'));
    await mkdir(join(root, 'scripts'));
    for (const name of ['package-ammonia-evidence.py', 'validate-ammonia-bundle.py']) {
      await copyFile(join('scripts', name), join(root, 'scripts', name));
    }
    await cp('evidence-bundles/ammonia-paired-20261019', join(root, 'evidence-bundles/ammonia-paired-20261019'), { recursive: true });
    const publicDirectory = join(root, 'public/evidence/bundles');
    await mkdir(publicDirectory, { recursive: true });
    const zip = join(publicDirectory, 'ammonia-paired-20261019.zip');
    const changed = Buffer.concat([await readFile(publicPath), Buffer.from('x')]);
    await writeFile(zip, changed);
    await mkdir(join(root, 'src/evidence'), { recursive: true });
    const caseSource = await readFile('src/evidence/cases.js', 'utf8');
    await writeFile(join(root, 'src/evidence/cases.js'), caseSource.replace(item.pairedBundle.sha256, createHash('sha256').update(changed).digest('hex')));
    const build = () => spawnSync('npm', ['run','build'], { cwd: root, encoding: 'utf8', timeout: 15000 });
    let result = build();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /differs from allowlisted source/);
    await assert.rejects(() => access(join(root, 'dist')));

    const stagedReceipt = join(root, 'evidence-bundles/ammonia-paired-20261019/reports/evidence-acceptance/ammonia-paired-20261019/receipt.json');
    const receipt = JSON.parse(await readFile(stagedReceipt, 'utf8'));
    receipt.status = 'incomplete';
    await writeFile(stagedReceipt, JSON.stringify(receipt));
    result = spawnSync('python3', ['-B','-I','-S','scripts/package-ammonia-evidence.py'], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    result = build();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Public Ammonia ZIP validation failed/);
    await assert.rejects(() => access(join(root, 'dist')));

    const publicReadme = join(root, 'evidence-bundles/ammonia-paired-20261019/README.md');
    await writeFile(publicReadme, (await readFile(publicReadme, 'utf8')) + '\nSECRET_SENTINEL\n');
    result = build();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Evidence member rejected/);
    assert.doesNotMatch(result.stdout + result.stderr, /SECRET_SENTINEL/);
    await assert.rejects(() => access(join(root, 'dist')));
  } finally { await rm(root, { recursive: true, force: true }); }
});
