import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { cases } from '../src/evidence/cases.js';
import { validateManifest, validateBenchmark, BENCHMARK_RUN, selectCases, readFilters } from '../src/evidence/schema.js';

const benchmarkCases = cases.filter(item => item.benchmark);
const artifact = async item => JSON.parse(await readFile('public' + item.benchmark.artifactPath, 'utf8'));
const clone = () => structuredClone(cases);

test('five release-archive benchmark cases bind to the pre-registration and their own artifacts', async () => {
  assert.equal(benchmarkCases.length, 5);
  const preregBytes = await readFile('public' + BENCHMARK_RUN.preregistration.artifactPath);
  assert.equal(createHash('sha256').update(preregBytes).digest('hex'), BENCHMARK_RUN.preregistration.sha256);
  const prereg = JSON.parse(preregBytes);
  for (const item of benchmarkCases) {
    const bytes = await readFile('public' + item.benchmark.artifactPath);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.benchmark.sha256);
    const data = JSON.parse(bytes);
    assert.doesNotThrow(() => validateBenchmark(item, data));
    const registered = prereg.cases.find(entry => entry.id === item.id);
    assert.ok(registered, `${item.id} was pre-registered`);
    assert.deepEqual(data.target.vulnerableRanges, registered.vulnerable.ranges);
    assert.deepEqual(data.target.fixedRanges, registered.fixed.ranges);
    assert.deepEqual(data.target.acceptedCwes, registered.acceptedCwes);
    assert.equal(data.arms.vulnerable.archiveSha256, registered.vulnerable.archiveSha256);
    assert.equal(data.arms.fixed.archiveSha256, registered.fixed.archiveSha256);
    assert.equal(item.detection.mode, 'release-archive');
    assert.equal(item.detection.sha256, data.arms.vulnerable.reportSha256);
    // The reported line must sit inside a pre-registered range with an accepted CWE.
    const match = data.arms.vulnerable.matches.find(m => m.line === item.detection.line);
    assert.ok(registered.vulnerable.ranges.some(([lo, hi]) => lo <= match.line && match.line <= hi));
    assert.ok(registered.acceptedCwes.includes(match.cwe));
    assert.equal(data.arms.fixed.matches.length, 0);
    assert.ok(!JSON.stringify(data).includes('--poc'));
  }
});

test('total model calls stay under the 400-call cap', () => {
  const total = benchmarkCases.reduce((sum, item) => sum + item.benchmark.vulnerable.calls + item.benchmark.fixed.calls, 0);
  assert.equal(total, 84);
  assert.ok(total + 1 <= 400, 'scan calls plus the model-id probe stay under the cap');
});

test('artifact validation rejects drift, unreviewed detail and invented outcomes', async () => {
  const item = benchmarkCases[0]; const data = await artifact(item);
  for (const mutate of [
    d => { d.caseId = 'other-case'; },
    d => { d.preregistration.sha256 = 'a'.repeat(64); },
    d => { d.arms.vulnerable.archiveSha256 = 'b'.repeat(64); },
    d => { d.arms.vulnerable.calls.total += 1; },
    d => { d.arms.vulnerable.outcome = 'missedReviewed'; },
    d => { d.arms.fixed.outcome = 'flagged'; },
    d => { d.arms.vulnerable.otherFindings.reviewed = true; },
    d => { d.arms.vulnerable.otherFindings.byStatus = { needs_human: 2 }; },
    d => { d.arms.fixed.matches.push({ file: 'other.js', line: 3, cwe: 'CWE-79', severity: 'low', status: 'candidate', title: 'Other issue', verification: [] }); },
    d => { d.arms.vulnerable.matches[0].privateTrace = 'SECRET_SENTINEL'; },
    d => { d.command += ' --poc'; },
    d => { d.hintLevel = 'L3'; },
  ]) {
    const changed = structuredClone(data); mutate(changed);
    assert.throws(() => validateBenchmark(item, changed));
  }
});

test('a pre-registered miss is shown as not-detected and can never be shown as a detection', () => {
  const data = clone(); const index = data.findIndex(item => item.benchmark);
  const miss = data[index];
  miss.benchmark.vulnerable.outcome = 'missedReviewed';
  assert.throws(() => validateManifest(data), 'a miss cannot keep status detected');
  miss.status = 'not-detected';
  assert.throws(() => validateManifest(data), 'a miss cannot carry a detection snapshot');
  delete miss.detection;
  assert.equal(validateManifest(data)[index].status, 'not-detected');
  for (const outcome of ['foundButRefuted', 'locationOnly', 'missedNotSelected', 'notRun']) {
    const value = structuredClone(data); value[index].benchmark.vulnerable.outcome = outcome;
    assert.doesNotThrow(() => validateManifest(value), outcome);
  }
  const found = clone(); found[index].status = 'not-detected';
  assert.throws(() => validateManifest(found), 'a found outcome cannot be hidden as not-detected');
  assert.equal(selectCases(data, readFilters('?status=not-detected')).length, 1);
});

test('benchmark fields are confined to historical cases with a registered profile', () => {
  for (const mutate of [
    c => { c.benchmark.artifactPath = '/evidence/benchmarks/historical-detection-20261020/other.json'; },
    c => { c.benchmark.vulnerable.calls = -1; },
    c => { c.benchmark.fixed.outcome = 'maybe'; },
    c => { c.benchmark.extra = true; },
    c => { c.detection.mode = 'focused'; },
    c => { c.id = 'unregistered-case'; c.benchmark.artifactPath = '/evidence/benchmarks/historical-detection-20261020/unregistered-case.json'; },
  ]) {
    const data = clone(); mutate(data.find(item => item.benchmark)); assert.throws(() => validateManifest(data));
  }
  const focused = clone(); focused[0].detection.mode = 'release-archive';
  assert.throws(() => validateManifest(focused), 'release-archive mode requires a benchmark');
});

test('detail page shows both arms, call counts, the pre-registration and the training-data caveat', async () => {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const [{ default: EvidencePage }, { LocaleCtx }, { cases: live }] = await Promise.all([
      server.ssrLoadModule('/src/components/EvidencePage.jsx'), server.ssrLoadModule('/src/locale.js'), server.ssrLoadModule('/src/evidence/cases.js'),
    ]);
    const render = (locale, id) => renderToStaticMarkup(React.createElement(LocaleCtx.Provider, { value: { locale } }, React.createElement(EvidencePage, { page: `evidence/${id}` })));
    for (const item of live.filter(value => value.benchmark)) for (const locale of ['zh', 'en']) {
      const html = render(locale, item.id);
      assert.ok(html.includes(`href="${item.benchmark.artifactPath}"`));
      assert.ok(html.includes(item.benchmark.sha256));
      assert.ok(html.includes(`href="${BENCHMARK_RUN.preregistration.artifactPath}"`));
      assert.ok(html.includes(locale === 'zh' ? '模型可能在訓練時看過這份公告' : 'The models may have seen this advisory'));
      assert.ok(html.includes(locale === 'zh' ? '候選也不等於自動確認' : 'a candidate is not an automatic confirmation'));
      assert.ok(html.includes(locale === 'zh' ? '修補版掃描對照' : 'Fixed-release scan control'));
      assert.ok(html.includes(`<td>${item.benchmark.vulnerable.calls}</td>`) && html.includes(`<td>${item.benchmark.fixed.calls}</td>`));
      assert.ok(!html.includes(locale === 'zh' ? '未提供修補版對照' : 'No fixed-version comparison'));
      assert.ok(!html.includes('將單一脆弱檔放入聚焦目錄') && !html.includes('isolate the vulnerable file'));
    }
    // A test-only miss renders as a disclosed miss, never as a detection match.
    const miss = structuredClone(live.find(value => value.benchmark));
    miss.id = 'benchmark-miss-fixture'; miss.status = 'not-detected'; delete miss.detection;
    miss.benchmark.vulnerable.outcome = 'missedReviewed';
    live.push(miss);
    try {
      for (const locale of ['zh', 'en']) {
        const html = render(locale, miss.id);
        assert.ok(html.includes(locale === 'zh' ? '未識別（歷史測試）' : 'Not detected (historical test)'));
        assert.ok(html.includes(locale === 'zh' ? '未命中（目標檔已審）' : 'Missed (target file reviewed)'));
        assert.ok(html.includes(locale === 'zh' ? '這筆未命中照樣公開' : 'The miss is published like any other result'));
        assert.ok(!html.includes(locale === 'zh' ? '識別命中（歷史測試）' : 'Detection match (historical test)'));
      }
    } finally { live.pop(); }
  } finally { await server.close(); }
});
