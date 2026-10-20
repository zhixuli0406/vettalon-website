import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { cases, PUBLIC_REVIEWER } from '../src/evidence/cases.js';
import { validateManifest, validateRegression, validateOrigin, caseProfiles } from '../src/evidence/schema.js';
import { caseStages, funnelByType, wilsonInterval, MIN_N_FOR_RATE } from '../src/evidence/funnel.js';
import { policyText } from '../src/evidence/policy.js';

const AMMONIA = 'ammonia-ghsa-x43w-36pp-96g3';
const clone = () => structuredClone(cases);
const ammoniaIndex = cases.findIndex(item => item.id === AMMONIA);

test('every public case names the human reviewer pseudonym and reuses the case review date', () => {
  assert.equal(PUBLIC_REVIEWER, 'zhixuli0406');
  for (const item of cases) {
    assert.equal(item.review.reviewer, PUBLIC_REVIEWER);
    assert.equal(item.review.reviewedAt, item.reviewedAt);
    assert.ok(item.review.aiUse.zh.includes('人工審閱者') && item.review.aiUse.en.includes('human reviewer'));
  }
  const data = clone(); for (const item of data) delete item.review;
  assert.doesNotThrow(() => validateManifest(data), 'the review block is optional');
});

test('review block rejects free-text names, emails, invented dates, extra keys and unsafe text', () => {
  for (const mutate of [
    c => c.review.reviewer = 'Louis Li',
    c => c.review.reviewer = 'someone@example.com',
    c => c.review.reviewer = '',
    c => c.review.reviewer = '-leading',
    c => c.review.reviewer = 'double--hyphen',
    c => c.review.reviewer = 'a'.repeat(40),
    c => c.review.reviewer = ['zhixuli0406'],
    c => c.review.reviewedAt = '2026-10-18',
    c => c.review.reviewedAt = '2026-02-30',
    c => delete c.review.aiUse,
    c => c.review.aiUse = { zh: 'x' },
    c => c.review.aiUse.en = 'See http://127.0.0.1/notes',
    c => c.review.email = 'SECRET_SENTINEL',
    c => c.review = 'zhixuli0406',
    c => c.review = null,
  ]) {
    const data = clone(); mutate(data[0]); assert.throws(() => validateManifest(data));
  }
});

test('disclosure stages only restate timeline dates and only on non-historical cases', () => {
  for (const mutate of [
    c => c.disclosure.reportedAt = '2026-10-15',
    c => c.disclosure.reportedAt = '2026-10-18',
    c => c.disclosure.fixedReleaseAt = '2026-10-15',
    c => c.disclosure.fixedReleaseAt = '2026-10-14',
    c => c.disclosure.acknowledgement.at = '2026-10-14',
    c => c.disclosure.acknowledgement.at = '2026-10-20',
    c => c.disclosure.acknowledgement.url = 'https://example.com/ack',
    c => c.disclosure.acknowledgement.url = 'http://localhost/ack',
    c => delete c.disclosure.acknowledgement,
    c => c.disclosure.reportCount = 3,
    c => c.disclosure = null,
  ]) {
    const data = clone(); mutate(data[ammoniaIndex]); assert.throws(() => validateManifest(data));
  }
  const historical = clone(); historical[0].disclosure = structuredClone(cases[ammoniaIndex].disclosure);
  assert.throws(() => validateManifest(historical), 'historical cases were not reported by Vettalon');
  const reported = clone(); reported[ammoniaIndex].type = 'reported'; delete reported[ammoniaIndex].origin; delete reported[ammoniaIndex].disclosure;
  assert.throws(() => validateManifest(reported), 'a reported case must carry its disclosure stages');
  const acknowledgedOnDate = clone(); acknowledgedOnDate[ammoniaIndex].disclosure.acknowledgement.at = '2026-10-17';
  assert.doesNotThrow(() => validateManifest(acknowledgedOnDate));
});

test('the Ammonia profile keeps every previous fixed expectation', () => {
  const profile = caseProfiles[AMMONIA];
  assert.ok(Object.isFrozen(caseProfiles) && Object.isFrozen(profile.regression.checks[0]));
  assert.deepEqual(profile.regression.checks.map(c => [c.id, c.role, c.vulnerable, c.testName]), [
    ['http_lower', 'denied-policy', 'ok', 'policy_css_url_http_lower_denied'],
    ['http_upper', 'denied-policy', 'failed', 'policy_css_url_http_upper_denied'],
    ['https_control', 'allowed-control', 'ok', 'policy_css_url_https_control'],
    ['relative_lower', 'denied-policy', 'ok', 'policy_css_url_relative_lower_denied'],
    ['relative_mixed', 'denied-policy', 'failed', 'policy_css_url_relative_mixed_denied'],
  ]);
  assert.deepEqual(profile.regression.scope, { kind: 'isolated-library-policy-tests', testCount: 5, inputCount: 7 });
  assert.deepEqual(profile.regression.arms, {
    vulnerable: { exitCode: 101, passed: 3, failed: 2, filtered: 108, summaryPrefix: 'test result: FAILED. 3 passed; 2 failed;' },
    fixed: { exitCode: 0, passed: 5, failed: 0, filtered: 109, summaryPrefix: 'test result: ok. 5 passed; 0 failed;' },
  });
  assert.deepEqual(profile.origin, {
    archivedToolOutputLineSha256: '2ffcb9b4dc279bcd1303990de185022dbdcce85661cca3229c1934b10e4fbb5e',
    version: '4.1.7', severityCandidate: 'medium', location: 'ammonia-4.1.7/src/style.rs:170',
    title: 'Case-sensitive url() match lets quoted URL()/Url() bypass style URL scheme and relative-URL filtering',
    draftFilename: 'ammonia_4_1_7-ai_audit_8c00985855923e82.md',
  });
  assert.deepEqual(profile.pairedBundle, { artifactPath: '/evidence/bundles/ammonia-paired-20261019.zip', kind: 'regression' });
});

test('reported-case validation is keyed by case id and fails closed for unregistered ids', async () => {
  const ammonia = cases[ammoniaIndex];
  const regression = JSON.parse(await readFile('public' + ammonia.regression.artifactPath, 'utf8'));
  const origin = JSON.parse(await readFile('public' + ammonia.origin.artifactPath, 'utf8'));
  const second = structuredClone(ammonia);
  second.id = 'second-reported-fixture'; second.type = 'reported';
  second.regression.artifactPath = `/evidence/regressions/${second.id}.json`;
  delete second.origin; delete second.pairedBundle;
  assert.throws(() => validateManifest([second]), 'no profile for this id');
  for (const id of ['constructor']) {
    const proto = structuredClone(second); proto.id = id; proto.regression.artifactPath = `/evidence/regressions/${id}.json`;
    assert.throws(() => validateManifest([proto]), `${id} must not resolve to a prototype member`);
  }
  // A second case registers its own expectations; the Ammonia shape is reused only as fixture data.
  const profiles = { ...caseProfiles, [second.id]: { regression: caseProfiles[AMMONIA].regression } };
  assert.doesNotThrow(() => validateManifest([...cases, second], { profiles }));
  const secondArtifact = { ...structuredClone(regression), caseId: second.id };
  assert.throws(() => validateRegression(second, secondArtifact));
  assert.doesNotThrow(() => validateRegression(second, secondArtifact, { profiles }));
  // Its profile cannot loosen Ammonia: Ammonia is still checked against its own entry.
  const loose = { ...profiles, [AMMONIA]: { ...caseProfiles[AMMONIA], regression: { ...caseProfiles[AMMONIA].regression, checks: caseProfiles[AMMONIA].regression.checks.slice(0, 4) } } };
  assert.throws(() => validateManifest(cases, { profiles: { ...caseProfiles, [AMMONIA]: undefined } }));
  assert.throws(() => validateRegression(ammonia, regression, { profiles: loose }), 'a changed check list does not match the published artifact');
  const missingOrigin = { ...caseProfiles, [AMMONIA]: { regression: caseProfiles[AMMONIA].regression, pairedBundle: caseProfiles[AMMONIA].pairedBundle } };
  assert.throws(() => validateOrigin(ammonia, origin, { profiles: missingOrigin }));
  assert.doesNotThrow(() => validateOrigin(ammonia, origin));
  const bundleOnUnknown = structuredClone(cases[0]); bundleOnUnknown.id = 'other-historical-case';
  bundleOnUnknown.dossier.artifactPath = `/evidence/dossiers/${bundleOnUnknown.id}.json`;
  assert.throws(() => validateManifest([bundleOnUnknown]), 'paired bundles are also keyed by id');
});

test('funnel derives counts and dates from structured fields only', () => {
  const byType = Object.fromEntries(funnelByType(cases).map(group => [group.type, group]));
  assert.deepEqual(Object.keys(byType), ['discovery', 'reported', 'historical']);
  const stage = (type, id) => byType[type].stages.find(s => s.id === id);
  assert.equal(byType.discovery.n, 1); assert.equal(byType.discovery.reviewed, 1);
  assert.deepEqual(stage('discovery', 'reported').entries, [{ id: AMMONIA, package: 'ammonia', date: '2026-10-16' }]);
  assert.deepEqual(stage('discovery', 'acknowledged').entries, [{ id: AMMONIA, package: 'ammonia', date: null }]);
  assert.deepEqual(stage('discovery', 'fixedRelease').entries.map(e => e.date), ['2026-10-17']);
  assert.deepEqual(stage('discovery', 'advisory').entries.map(e => e.date), ['2026-10-17']);
  for (const id of ['reported', 'acknowledged', 'fixedRelease', 'advisory']) assert.equal(stage('discovery', id).count, 1);
  assert.equal(byType.reported.n, 0);
  assert.ok(byType.reported.stages.every(s => s.count === null && s.entries.length === 0));
  assert.equal(byType.historical.n, 2);
  for (const id of ['reported', 'acknowledged']) {
    assert.equal(stage('historical', id).count, null); assert.equal(stage('historical', id).notApplicable, true);
  }
  assert.equal(stage('historical', 'fixedRelease').count, 2);
  assert.ok(stage('historical', 'fixedRelease').entries.every(e => e.date === null), 'no fixed-release date is invented');
  assert.deepEqual(stage('historical', 'advisory').entries.map(e => e.date), ['2017-06-27', '2024-01-29']);
  for (const group of Object.values(byType)) for (const s of group.stages) assert.equal(s.interval, null, 'n < 10 never yields a rate');
  const noDisclosure = structuredClone(cases[ammoniaIndex]); delete noDisclosure.disclosure;
  assert.deepEqual(caseStages(noDisclosure).reported, { state: 'unknown', date: null });
  assert.deepEqual(caseStages(noDisclosure).acknowledged, { state: 'unknown', date: null });
});

test('Wilson interval is only produced for n >= 10', () => {
  assert.equal(MIN_N_FOR_RATE, 10);
  assert.equal(wilsonInterval(1, 1), null);
  assert.equal(wilsonInterval(9, 9), null);
  const [lo, hi] = wilsonInterval(10, 20);
  assert.ok(Math.abs(lo - 0.2993) < 0.001 && Math.abs(hi - 0.7007) < 0.001);
  const [zeroLo, zeroHi] = wilsonInterval(0, 10);
  assert.ok(Math.abs(zeroLo) < 1e-9); assert.ok(Math.abs(zeroHi - 0.2775) < 0.001);
  assert.equal(wilsonInterval(11, 10), null);
});

test('policy sentence counts follow the manifest', () => {
  assert.equal(policyText('zh', cases), '兩筆歷史聚焦識別測試與一筆 Vettalon 原創發現分開列示。Ammonia 保留產品候選及擬稿、人工送件、上游修補與限定回歸的證據邊界；未公開候選不在此列。');
  assert.equal(policyText('en', cases), 'Two historical focused detections and one original Vettalon discovery are labeled separately. Ammonia traces the product candidate and draft, human submission, upstream fix, and scoped regression. Unpublished candidates are excluded.');
  const extra = [...cases, { ...cases[ammoniaIndex], id: 'extra-reported-fixture', type: 'reported' }];
  assert.ok(policyText('zh', extra).startsWith('兩筆歷史聚焦識別測試、一筆 Vettalon 原創發現與一筆上游通報分開列示。'));
  assert.ok(policyText('en', extra).startsWith('Two historical focused detections, one original Vettalon discovery, and one upstream report are labeled separately.'));
});

async function renderer() {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const [{ default: EvidencePage }, { default: EvidenceFunnel }, { LocaleCtx }, mod] = await Promise.all([
    server.ssrLoadModule('/src/components/EvidencePage.jsx'),
    server.ssrLoadModule('/src/components/EvidenceFunnel.jsx'),
    server.ssrLoadModule('/src/locale.js'),
    server.ssrLoadModule('/src/evidence/cases.js'),
  ]);
  const wrap = (locale, element) => renderToStaticMarkup(React.createElement(LocaleCtx.Provider, { value: { locale } }, element));
  return {
    server, cases: mod.cases,
    page: (locale, id) => wrap(locale, React.createElement(EvidencePage, { page: id ? `evidence/${id}` : 'evidence' })),
    funnel: (locale, manifest) => wrap(locale, React.createElement(EvidenceFunnel, { cases: manifest, locale })),
  };
}

test('case detail pages show the reviewer pseudonym, review date and AI-use note in both locales', async () => {
  const { server, cases: live, page } = await renderer();
  try {
    for (const item of live) {
      const zh = page('zh', item.id); const en = page('en', item.id);
      assert.ok(zh.includes(`人工審閱：zhixuli0406（${item.reviewedAt}）`));
      assert.ok(en.includes(`Human review: zhixuli0406 (${item.reviewedAt})`));
      assert.ok(zh.includes('人工審閱與 AI 使用') && en.includes('Human review and AI use'));
      assert.ok(zh.includes(item.review.aiUse.zh) && en.includes(item.review.aiUse.en));
    }
    const unreviewed = structuredClone(live[0]); unreviewed.id = 'unreviewed-render-fixture'; delete unreviewed.review;
    live.push(unreviewed);
    try { assert.ok(!page('zh', unreviewed.id).includes('人工審閱：')); } finally { live.pop(); }
  } finally { await server.close(); }
});

test('evidence wall renders the funnel per case type with n, dates, legend and human-review note', async () => {
  const { server, cases: live, page, funnel } = await renderer();
  try {
    for (const locale of ['zh', 'en']) {
      const html = page(locale, '');
      const section = html.match(/<section class="evidence__funnel"[\s\S]*<\/section>/)?.[0];
      assert.ok(section, 'funnel appears on the list page');
      assert.ok(html.indexOf('class="evidence__list"') < html.indexOf('class="evidence__funnel"'));
      for (const type of ['discovery', 'reported', 'historical']) assert.ok(section.includes(`data-type="${type}"`));
      assert.ok(section.includes('n = 1') && section.includes('n = 2') && section.includes('n = 0'));
      for (const date of ['2026-10-16', '2026-10-17', '2017-06-27', '2024-01-29']) assert.ok(section.includes(`<time dateTime="${date}">${date}</time>`), date);
      assert.ok(section.includes('1 / 1') && section.includes('2 / 2'));
      assert.ok(!section.includes('%'), 'no percentages for n < 10');
      assert.ok(section.includes(locale === 'zh' ? '「—」表示沒有可公開的結構化資料' : '“—” means no publishable structured data'));
      assert.ok(section.includes(locale === 'zh' ? '哪些階段經人工審閱' : 'Which stages are human-reviewed'));
      assert.ok(section.includes(locale === 'zh' ? '少於 10 筆，只列筆數，不換算比例' : 'fewer than 10: counts only, no rates'));
      assert.ok(section.includes(locale === 'zh' ? '人工核對' : 'Human-checked'));
      assert.ok(section.includes(locale === 'zh' ? '尚無公開案例' : 'No public cases yet'));
      assert.equal((section.match(/data-funnel="unknown"/g) || []).length, 2, 'historical report and acknowledgement show —');
    }
    // Filters do not change the funnel: it always summarises every public case.
    assert.equal(funnel('zh', live), page('zh', '').match(/<section class="evidence__funnel"[\s\S]*<\/section>/)[0]);
    const many = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(live[0]), id: `historical-fixture-${i}` }));
    const large = funnel('en', many);
    assert.ok(large.includes('Wilson 95% interval 76–100%'), 'a rate appears only with a Wilson interval once n >= 10');
    assert.ok(!large.includes('fewer than 10'));
  } finally { await server.close(); }
});

test('built evidence pages ship the funnel and reviewer line', async () => {
  for (const [path, needle] of [['dist/evidence/index.html', '通報漏斗'], ['dist/en/evidence/index.html', 'Disclosure funnel'], [`dist/evidence/${AMMONIA}/index.html`, '人工審閱：zhixuli0406（2026-10-19）'], [`dist/en/evidence/${AMMONIA}/index.html`, 'Human review: zhixuli0406 (2026-10-19)']]) {
    const html = await readFile(path, 'utf8');
    assert.ok(html.includes(needle), `${path} includes ${needle}`);
    assert.doesNotMatch(html, /127\.0\.0\.1|localhost/i);
  }
});
