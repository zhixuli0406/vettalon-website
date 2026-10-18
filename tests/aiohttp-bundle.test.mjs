import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cases } from '../src/evidence/cases.js';
import { validatePairedBundleFiles } from '../scripts/evidence-bundles.mjs';

const item = cases.find(value => value.id === 'aiohttp-cve-2024-23334');
const publicPath = 'public' + item.pairedBundle.artifactPath;
const report = 'reports/evidence-acceptance/aiohttp-paired-20261019/';

test('aiohttp ZIP is deterministic, pinned and verifies after safe extraction', async () => {
  const check = spawnSync('python3', ['-B','-I','-S','scripts/package-aiohttp-evidence.py','--check'], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  const bytes = await readFile(publicPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.pairedBundle.sha256);
  await assert.doesNotReject(() => validatePairedBundleFiles(cases, 'public'));
  const root = await mkdtemp(join(tmpdir(), 'aiohttp-public-bundle-'));
  try {
    const unpack = spawnSync('python3', ['-B','-I','-S','-c', `import pathlib,sys,zipfile
root=pathlib.Path(sys.argv[1]); bundle=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(bundle) as archive:
    names=archive.namelist()
    assert len(names)==len(set(names))==21
    assert all(not name.startswith('/') and '..' not in pathlib.PurePosixPath(name).parts for name in names)
    assert all((member.external_attr >> 16) & 0o170000 == 0o100000 for member in archive.infolist())
    archive.extractall(root)
`, root, publicPath], { encoding: 'utf8' });
    assert.equal(unpack.status, 0, unpack.stderr);
    const verify = spawnSync('python3', ['-B','-I','-S',report + 'verify.py'], { cwd: root, encoding: 'utf8' });
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /pass_offline_readback: aiohttp 3\.9\.1\/3\.9\.2 four raw HTTP cells/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('aiohttp publication gate rejects missing, changed and symlinked ZIP', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aiohttp-bundle-gate-'));
  try {
    const directory = join(root, 'evidence', 'bundles');
    await mkdir(directory, { recursive: true });
    await assert.rejects(() => validatePairedBundleFiles([item], root));
    const path = join(directory, 'aiohttp-paired-20261019.zip');
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

test('aiohttp build gate rejects unexpected member and invalid repacked receipt before Vite', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aiohttp-bundle-negative-'));
  try {
    await mkdir(join(root, 'scripts'));
    for (const name of ['package-aiohttp-evidence.py', 'validate-aiohttp-bundle.py']) {
      await copyFile(join('scripts', name), join(root, 'scripts', name));
    }
    await cp('evidence-bundles/aiohttp-paired-20261019', join(root, 'evidence-bundles/aiohttp-paired-20261019'), { recursive: true });
    const target = join(root, 'public/evidence/bundles');
    await mkdir(target, { recursive: true });
    const zip = join(target, 'aiohttp-paired-20261019.zip');
    await copyFile(publicPath, zip);
    const gate = () => spawnSync('python3', ['-B','-I','-S','scripts/validate-aiohttp-bundle.py','--root',root], { encoding: 'utf8', timeout: 15000 });
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
    assert.equal(spawnSync('python3', ['-B','-I','-S','-c',inject,zip]).status, 0);
    assert.equal(gate().status, 1);

    const stagedReceipt = join(root, 'evidence-bundles/aiohttp-paired-20261019', report, 'run-08/receipt.json');
    const receipt = JSON.parse(await readFile(stagedReceipt, 'utf8'));
    receipt.status = 'incomplete';
    await writeFile(stagedReceipt, JSON.stringify(receipt));
    const repack = spawnSync('python3', ['-B','-I','-S','scripts/package-aiohttp-evidence.py'], { cwd: root, encoding: 'utf8' });
    assert.equal(repack.status, 0, repack.stderr);
    assert.equal(gate().status, 1, 'repacked invalid receipt must fail offline verifier');
  } finally { await rm(root, { recursive: true, force: true }); }
});
