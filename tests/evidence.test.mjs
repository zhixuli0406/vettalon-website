import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManifest, validateDossier, selectCases, readFilters, filterQuery } from '../src/evidence/schema.js';
import { cases } from '../src/evidence/cases.js';
import { parseRoute } from '../src/route.js';

const clone = () => structuredClone(cases);

test('curated public manifest passes and exposes no private paths', () => {
  assert.deepEqual(validateManifest(cases), cases);
  assert.doesNotMatch(JSON.stringify(cases), /\/Users\/|embargo|vettalon-pro/);
});

test('publication is fail closed for unpublished, missing approval and unknown fields', () => {
  for (const change of [c => c.publication = 'embargoed', c => delete c.reviewedAt, c => c.privateNotes = 'SECRET_SENTINEL']) {
    const data = clone(); change(data[0]);
    assert.throws(() => validateManifest(data));
  }
});

test('rejects original discovery without upstream credit and reproduction without evidence', () => {
  let data = clone(); data[0].type = 'discovery'; assert.throws(() => validateManifest(data));
  data = clone(); data[0].status = 'reproduced'; assert.throws(() => validateManifest(data));
});

test('rejects unsafe links, duplicate IDs and local artifact paths', () => {
  for (const url of ['javascript:alert(1)', 'https://github.com/x/y/security/advisories/new', '/Users/me/report.json', 'https://localhost/x', 'https://example.com/private']) {
    const data = clone(); data[0].advisoryUrl = url; assert.throws(() => validateManifest(data));
  }
  assert.throws(() => validateManifest([cases[0], cases[0]]));
});

test('paired raw bundles are confined to the fixed case paths and digests', () => {
  for (const index of [0, cases.findIndex(item => item.id === 'ammonia-ghsa-x43w-36pp-96g3')]) {
    for (const mutate of [
      value => value.pairedBundle.artifactPath = '/evidence/bundles/other.zip',
      value => value.pairedBundle.sha256 = 'bad',
      value => value.pairedBundle.testedAt = '2099-01-01',
      value => value.pairedBundle.testedAt = '2026-10-17',
      value => value.pairedBundle.privateSource = 'SECRET_SENTINEL',
    ]) {
      const data = clone(); mutate(data[index]); assert.throws(() => validateManifest(data));
    }
  }
});

test('filters combine type, ecosystem, status and case insensitive search', () => {
  assert.equal(selectCases(cases, { q: 'CVE-2024-23334', type: 'historical', ecosystem: 'PyPI', status: 'detected' }).length, 1);
  assert.equal(selectCases(cases, { q: 'NO_SUCH_CASE' }).length, 0);
  assert.equal(selectCases(cases, { type: 'discovery' }).length, 1);
  assert.equal(selectCases(cases, { q: '<script>' }).length, 0);
  assert.equal(selectCases(cases, { q: 'AIOHTTP' })[0].package, 'aiohttp');
});

test('query is shareable, bounded, rejects invalid facets, and sorts deterministically', () => {
  const filters = readFilters('?q=aiohttp&type=historical&ecosystem=PyPI&status=detected&sort=oldest');
  assert.deepEqual(readFilters(filterQuery(filters)), filters);
  assert.equal(readFilters('?status=confirmed').status, '');
  assert.equal(readFilters('?q=' + 'a'.repeat(1000)).q.length, 200);
  const oldest = selectCases(cases, { sort: 'oldest' });
  assert.ok(oldest[0].publishedAt <= oldest.at(-1).publishedAt);
});

test('routes preserve case detail and reject unrelated locale prefixes', () => {
  assert.deepEqual(parseRoute('/en/evidence/aiohttp-cve-2024-23334/'), { locale: 'en', page: 'evidence/aiohttp-cve-2024-23334' });
  assert.deepEqual(parseRoute('/evidence/'), { locale: 'zh', page: 'evidence' });
  assert.equal(parseRoute('/enterprise/').locale, 'zh');
  assert.equal(parseRoute('/evidence/missing/').page, 'evidence/missing');
});

test('minimal public snapshots exclude unrelated finding fields', () => {
  const data = clone(); data[0].detection.privateReview = 'SECRET_SENTINEL';
  assert.throws(() => validateManifest(data));
  for (const item of cases.filter(item => item.detection)) {
    assert.ok(item.detection.claim.en.length > 0 && item.detection.reviewerConclusion.zh.length > 0);
    assert.match(item.detection.rerun,/vettalon scan/);
    // Older focused scans did not record model versions; release-archive benchmark scans name them.
    assert.match(item.detection.modelVersions, item.detection.mode === 'focused' ? /not recorded/ : /claude-opus-5-5/);
  }
});

test('reproduction data must include successful differential controls and a public artifact', () => {
  const data = clone();
  data[0].status = 'reproduced';
  delete data[0].pairedBundle;
  data[0].reproduction = { mode: 'differential', artifactUrl: 'https://vettalon.dudustudio.monster/evidence/example.json', sha256: 'a'.repeat(64), vulnerable: 'pass', fixed: 'pass', control: 'pass' };
  assert.equal(validateManifest(data)[0].status,'reproduced');
  data[0].reproduction.control = 'not-run'; assert.throws(() => validateManifest(data));
});

test('calendar dates must exist, including century leap-year rules', () => {
  for (const invalid of ['2026-02-29','2026-02-30','2026-04-31','1900-02-29','2026-13-01','2026-00-10']) {
    // The public review block must restate reviewedAt, so both move together in these fixtures.
    const data = clone(); delete data[0].pairedBundle; data[0].reviewedAt = invalid; data[0].review.reviewedAt = invalid;
    data[0].publishedAt = '1800-01-01'; data[0].timeline = [{date:'1800-01-01',event:{zh:'已公開',en:'Public'}}];
    data[0].detection.observedAt = '1800-01-01';
    assert.throws(() => validateManifest(data),invalid);
  }
  const data=clone(); delete data[0].pairedBundle; data[0].reviewedAt = '2000-02-29'; data[0].review.reviewedAt = '2000-02-29'; data[0].publishedAt = '2000-02-28';
  data[0].detection.observedAt = '2000-02-28';data[0].timeline=[{date:'2000-02-28',event:{zh:'已公開',en:'Public'}}];
  assert.equal(validateManifest(data)[0].reviewedAt,'2000-02-29');
});

test('observations and ordered timeline cannot postdate review; pre-disclosure research is allowed', () => {
  for (const change of [c => c.detection.observedAt='2099-01-01',c => c.timeline[1].date='2099-01-01',c => c.timeline.reverse(),c => c.timeline[1].date='2026-02-30',c => c.publishedAt='2099-01-01']) {
    const data=clone(); change(data[0]); assert.throws(() => validateManifest(data));
  }
  const data=clone();data[0].detection.observedAt='2020-01-01';data[0].timeline.unshift({date:'2020-01-01',event:{zh:'公開前研究',en:'Pre-disclosure research'}});
  assert.equal(validateManifest(data)[0].detection.observedAt,'2020-01-01');
  data[0].timeline.splice(1,0,{date:'2020-01-01',event:{zh:'同日覆核',en:'Same-day review'}});
  assert.doesNotThrow(() => validateManifest(data));
  data[0].timeline.push(structuredClone(data[0].timeline.at(-1)));
  assert.throws(() => validateManifest(data));
});

test('detection file must be a relative POSIX path and public text excludes Windows private paths', () => {
  for (const file of ['C:\\workspace\\private\\file.js','C:/workspace/private/file.js','\\\\server\\share\\secret.js','/etc/passwd','a/../secret','a//file.js','./file.js']) {
    const data=clone();data[0].detection.file=file;assert.throws(() => validateManifest(data),file);
  }
  const data=clone();data[0].summary.en='Stored at C:\\workspace\\private\\file.js';assert.throws(() => validateManifest(data));
});

// Simulate JSON ingestion so arrays cannot masquerade as scalar public identifiers.
test('rejects non-string public identifiers from JSON', async t => {
  for (const field of ['id', 'cve', 'ghsa', 'cwe']) await t.test(field, () => {
    for (const value of [[cases[0][field]], {}, null, 42, true]) {
      const data = JSON.parse(JSON.stringify(cases));
      data[0][field] = value;
      assert.throws(() => validateManifest(data), `${field} must reject ${JSON.stringify(value)}`);
    }
  });
});

test('rejects non-string public evidence digests from JSON', async t => {
  const digest = 'a'.repeat(64);
  for (const section of ['detection', 'dossier', 'reproduction']) await t.test(section, () => {
    for (const value of [[digest], {}, null, 42, true]) {
      const data = JSON.parse(JSON.stringify(cases));
      if (section === 'reproduction') {
        data[0].status = 'reproduced';
        data[0].reproduction = { mode: 'differential', artifactUrl: 'https://vettalon.dudustudio.monster/evidence/example.json', sha256: digest, vulnerable: 'pass', fixed: 'pass', control: 'pass' };
      }
      data[0][section].sha256 = value;
      assert.throws(() => validateManifest(data), `${section} digest must reject ${JSON.stringify(value)}`);
    }
  });
  await t.test('dossier reported file', async () => {
    const { readFile } = await import('node:fs/promises');
    const original = JSON.parse(await readFile('public' + cases[0].dossier.artifactPath, 'utf8'));
    for (const value of [[digest], {}, null, 42, true]) {
      const dossier = JSON.parse(JSON.stringify(original));
      dossier.finding.reportedFileSha256 = value;
      assert.throws(() => validateDossier(cases[0], dossier), `reported file digest must reject ${JSON.stringify(value)}`);
    }
  });
});
