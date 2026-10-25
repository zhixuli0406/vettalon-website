import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile, mkdir, copyFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cases } from '../src/evidence/cases.js';
import { validateManifest } from '../src/evidence/schema.js';

const sentinel = 'DO_NOT_PUBLISH_PRIVATE_SENTINEL';
test('publication preflight rejects embargoed record before bundling without leaking it in logs', async () => {
  const temp = await mkdtemp(join(tmpdir(),'vettalon-publication-'));
  try {
    const data = structuredClone(cases); data.push({ publication: 'embargoed', id: sentinel, privateNotes: sentinel });
    const path = join(temp,'candidate.json'); await writeFile(path,JSON.stringify(data));
    const run = spawnSync(process.execPath,['scripts/validate-evidence.mjs',path],{ encoding: 'utf8' });
    assert.equal(run.status,1); assert.match(run.stderr,/Public evidence publication gate failed\./);
    assert.doesNotMatch(run.stdout + run.stderr,new RegExp(sentinel));
  } finally { await rm(temp,{ recursive:true,force:true }); }
});

const runOutputGate = (dir) => spawnSync(process.execPath, ['scripts/publication-text-gate.mjs', dir], { encoding: 'utf8' });

test('built public assets contain no private sentinel, paths or private report repo', async () => {
  const run = runOutputGate('dist');
  assert.equal(run.status, 0, run.stderr);
  for (const item of cases) {
    assert.deepEqual(JSON.parse(await readFile(`dist/evidence/records/${item.id}.json`,'utf8')),item);
    for (const prefix of ['','en/']) {
      const html = await readFile(`dist/${prefix}evidence/${item.id}/index.html`,'utf8');
      assert.ok(html.includes(item.cve ?? item.ghsa) && html.includes(item.advisoryUrl));
      assert.ok(html.includes('hreflang="zh-Hant"') && html.includes('hreflang="en"'));
    }
  }
});

test('public homepage and machine-readable index show cases without unsupported performance figures', async () => {
  for (const path of ['dist/index.html', 'dist/en/index.html', 'dist/llms.txt', 'dist/llms-full.txt']) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /CVE-2024-23334/);
    assert.match(source, /CVE-2017-9841/);
    assert.match(source, /GHSA-x43w-36pp-96g3/);
    assert.doesNotMatch(source, /9\/9|8\/9|5\/9|57%|91%|OWASP Benchmark 160/);
  }
  const index = await readFile('dist/index.html', 'utf8');
  const english = await readFile('dist/en/index.html', 'utf8');
  assert.match(index, /href="\/evidence\/ammonia-ghsa-x43w-36pp-96g3\/"/);
  assert.match(english, /href="\/en\/evidence\/ammonia-ghsa-x43w-36pp-96g3\/"/);
  assert.match(index, /href="\/evidence\/aiohttp-cve-2024-23334\/"/);
  assert.match(english, /href="\/en\/evidence\/phpunit-cve-2017-9841\/"/);
  const detail = await readFile('dist/evidence/ammonia-ghsa-x43w-36pp-96g3/index.html', 'utf8');
  assert.match(detail, /RUSTSEC-2026-0373/);
  assert.match(detail, /href="\/evidence\/bundles\/ammonia-paired-20261019\.zip"/);
  const englishDetail = await readFile('dist/en/evidence/ammonia-ghsa-x43w-36pp-96g3/index.html', 'utf8');
  assert.match(englishDetail, /href="\/evidence\/bundles\/ammonia-paired-20261019\.zip"/);
  assert.deepEqual(await readFile('dist/evidence/bundles/ammonia-paired-20261019.zip'), await readFile('public/evidence/bundles/ammonia-paired-20261019.zip'));
  assert.deepEqual(await readFile('dist/evidence/bundles/aiohttp-paired-20261019.zip'), await readFile('public/evidence/bundles/aiohttp-paired-20261019.zip'));
  assert.doesNotMatch(detail, /ammonia · null|CVE: null|CWE: null/);
});

test('actual prerender safely encodes HTML-sensitive JSON-LD values', async () => {
  const temp = await mkdtemp(join(tmpdir(),'vettalon-jsonld-'));
  try {
    for (const dir of ['src','scripts','dist','dist-server']) await mkdir(join(temp,dir));
    for (const file of ['src/i18n.js','src/legal.js','src/plan.js','src/download-copy.js','src/downloads.js','scripts/prerender.mjs','scripts/evidence-artifacts.mjs','scripts/evidence-bundles.mjs']) await copyFile(file,join(temp,file));
    try { await copyFile('scripts/json-ld.mjs',join(temp,'scripts/json-ld.mjs')); } catch (error) { if(error.code !== 'ENOENT') throw error; }
    const data=structuredClone(cases);
    const payload='</script><img src=x onerror=alert(1)> & \u2028 \u2029';
    data[0].package=payload;
    assert.doesNotThrow(() => validateManifest(data));
    await writeFile(join(temp,'package.json'),JSON.stringify({type:'module'}));
    await mkdir(join(temp,'src/evidence'));
    await copyFile('src/evidence/schema.js',join(temp,'src/evidence/schema.js'));
    await copyFile('src/evidence/homepage.js',join(temp,'src/evidence/homepage.js'));
    await mkdir(join(temp,'dist/evidence/dossiers'),{recursive:true});
    await mkdir(join(temp,'dist/evidence/regressions'),{recursive:true});
    await mkdir(join(temp,'dist/evidence/origins'),{recursive:true});
    await mkdir(join(temp,'dist/evidence/bundles'),{recursive:true});
    for (const item of cases.filter(value => value.pairedBundle)) await copyFile('public' + item.pairedBundle.artifactPath,join(temp,'dist',item.pairedBundle.artifactPath.slice(1)));
    for (const item of cases) if (item.dossier) await copyFile('public' + item.dossier.artifactPath,join(temp,'dist',item.dossier.artifactPath.slice(1)));
    for (const item of cases) if (item.regression) await copyFile('public' + item.regression.artifactPath,join(temp,'dist',item.regression.artifactPath.slice(1)));
    for (const item of cases) if (item.origin) await copyFile('public' + item.origin.artifactPath,join(temp,'dist',item.origin.artifactPath.slice(1)));
    await mkdir(join(temp,'dist/evidence/benchmarks/historical-detection-20261020'),{recursive:true});
    await copyFile('public/evidence/benchmarks/historical-detection-20261020/preregistration.json',join(temp,'dist/evidence/benchmarks/historical-detection-20261020/preregistration.json'));
    for (const item of cases) if (item.benchmark) await copyFile('public' + item.benchmark.artifactPath,join(temp,'dist',item.benchmark.artifactPath.slice(1)));

    await writeFile(join(temp,'src/evidence/cases.js'),'export const cases = '+JSON.stringify(data)+';');
    await writeFile(join(temp,'dist-server/entry-server.js'),'export function render() {return "<main>isolated prerender fixture</main>";}');
    await writeFile(join(temp,'dist/index.html'),'<html lang="zh-Hant"><head><!--app-head--></head><body><!--app-html--></body></html>');
    const run=spawnSync(process.execPath,['scripts/prerender.mjs'],{cwd:temp,encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const html=await readFile(join(temp,`dist/evidence/${cases[0].id}/index.html`),'utf8');
    assert.ok(!html.includes(payload),'Closing script payload must not occur raw in generated HTML');
    const body=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(body); assert.doesNotMatch(body,/[<>&\u2028\u2029]/);
    assert.ok(JSON.parse(body).name.startsWith(payload));
  } finally {await rm(temp,{recursive:true,force:true});}
});

test('publication text gate rejects sentinel in CSS', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'vettalon-publication-css-'));
  try {
    const assets = join(temp, 'nested', 'assets');
    await mkdir(assets, { recursive: true });
    const path = join(assets, 'fixture.css');
    await writeFile(path, "body { color: black; }");
    assert.equal(runOutputGate(temp).status, 0);
    await writeFile(path, "body { color: black; } /* DO_NOT_PUBLISH_PRIVATE_SENTINEL */");
    const run = runOutputGate(temp);
    assert.equal(run.status, 1);
    assert.equal(run.stderr, 'Public output text gate failed.\n');
    assert.doesNotMatch(run.stdout + run.stderr, /DO_NOT_PUBLISH_PRIVATE_SENTINEL/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('publication text gate rejects sentinel in SVG', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'vettalon-publication-svg-'));
  try {
    const assets = join(temp, 'nested', 'assets');
    await mkdir(assets, { recursive: true });
    const path = join(assets, 'fixture.svg');
    await writeFile(path, "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
    assert.equal(runOutputGate(temp).status, 0);
    await writeFile(path, "<svg xmlns=\"http://www.w3.org/2000/svg\"><!-- DO_NOT_PUBLISH_PRIVATE_SENTINEL --></svg>");
    const run = runOutputGate(temp);
    assert.equal(run.status, 1);
    assert.equal(run.stderr, 'Public output text gate failed.\n');
    assert.doesNotMatch(run.stdout + run.stderr, /DO_NOT_PUBLISH_PRIVATE_SENTINEL/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('production build invokes the output gate after prerender', async () => {
  const { scripts } = JSON.parse(await readFile('package.json', 'utf8'));
  assert.match(scripts.build, /node scripts\/prerender\.mjs && node scripts\/publication-text-gate\.mjs$/);
});

test('output gate fails closed for private paths, symlinks, unknown assets, invalid text and missing dist', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'vettalon-publication-fail-'));
  try {
    const asset = join(temp, 'asset.txt');
    await writeFile(asset, 'safe');
    for (const privatePath of ['/Users/example/private', '/home/example/private', 'C:\\Users\\example\\private', 'C:\\users\\example\\private', 'C:/users/example/private', 'D:\\workspace\\private.txt', 'E:/workspace/private.txt']) {
      await writeFile(asset, privatePath);
      const run = runOutputGate(temp);
      assert.equal(run.status, 1);
      assert.equal(run.stderr, 'Public output text gate failed.\n');
      assert.ok(!(run.stdout + run.stderr).includes(privatePath));
    }
    await writeFile(asset, Buffer.from([0xff]));
    assert.equal(runOutputGate(temp).status, 1);
    await writeFile(asset, 'safe');
    await symlink(asset, join(temp, 'link.txt'));
    assert.equal(runOutputGate(temp).status, 1);
    await rm(join(temp, 'link.txt'));
    await writeFile(join(temp, 'unknown.custom'), 'safe');
    assert.equal(runOutputGate(temp).status, 1);
    assert.equal(runOutputGate(join(temp, 'missing')).status, 1);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
