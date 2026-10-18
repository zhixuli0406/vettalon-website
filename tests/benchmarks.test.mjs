import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { render } from '../dist-server/entry-server.js';
import { content, countLabel } from '../src/i18n.js';
import { cases } from '../src/evidence/cases.js';
import { homepageEvidence } from '../src/evidence/homepage.js';

test('homepage covers the exact public manifest with manifest-derived references and types', () => {
  const publicCases = cases.filter((item) => item.publication === 'public');
  assert.equal(publicCases.length, 3);
  assert.equal(publicCases.filter((item) => item.type === 'historical').length, 2);
  assert.equal(publicCases.filter((item) => item.type === 'discovery').length, 1);
  for (const locale of ['zh', 'en']) {
    const { items, counts } = homepageEvidence(cases, content[locale].benchmarks.items);
    assert.deepEqual(counts, { public: 3, historical: 2, discovery: 1, reported: 0 });
    assert.equal(items[0].id, 'ammonia-ghsa-x43w-36pp-96g3');
    assert.deepEqual(new Set(items.map((item) => item.id)), new Set(publicCases.map((item) => item.id)));
    for (const item of items) {
      const record = publicCases.find((value) => value.id === item.id);
      assert.equal(item.type, record.type);
      assert.equal(item.v, item.type === 'historical' ? (record.cve || record.ghsa) : (record.ghsa || record.cve));
    }
    const html = render(locale, '');
    assert.match(html, /data-public-case-count="3"/);
    assert.ok(html.includes(content[locale].benchmarks.collection.boundary));
    if (locale === 'en') {
      const countText = html.match(/<p class="section-note rv" data-public-case-count="3">([\s\S]*?)<\/p>/)?.[1].replace(/<[^>]*>/g, '');
      assert.match(countText, /3 public cases.*2 historical focused detections.*1 original discovery/);
      assert.doesNotMatch(countText, /1 original discoveries/);
    }
    const grid = html.match(/<div class="benchmark-grid">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(grid?.indexOf('GHSA-x43w-36pp-96g3') < grid?.indexOf('CVE-2024-23334'), 'the rendered homepage leads with Ammonia');
    for (const item of items) {
      assert.ok(html.includes(`data-case-type="${item.type}"`));
      assert.ok(html.includes(`${locale === 'en' ? '/en' : ''}/evidence/${item.id}/`));
    }
  }
});

test('English count labels handle singular, zero and plural while Chinese labels stay unchanged', () => {
  assert.equal(countLabel(content.en.benchmarks.collection.discovery, 1), 'original discovery');
  assert.equal(countLabel(content.en.benchmarks.collection.discovery, 0), 'original discoveries');
  assert.equal(countLabel(content.en.benchmarks.collection.discovery, 2), 'original discoveries');
  assert.equal(countLabel(content.zh.benchmarks.collection.discovery, 1), '筆原創發現');
});

test('homepage fails closed when public cases or translated cards drift', () => {
  const copy = content.en.benchmarks.items;
  assert.throws(() => homepageEvidence(cases, copy.slice(1)), /must match/);
  assert.throws(() => homepageEvidence(cases, [...copy, copy[0]]), /must match/);
  assert.throws(() => homepageEvidence(cases, [...copy.slice(0, 2), { ...copy[2], id: 'unpublished-case' }]), /incomplete/);
  const added = [...cases, { ...cases[0], id: 'new-public-case' }];
  assert.throws(() => homepageEvidence(added, copy), /must match/);
});

test('Ammonia homepage copy retains the product-output and publication boundary in both locales', async () => {
  const ammonia = cases.find((item) => item.id === 'ammonia-ghsa-x43w-36pp-96g3');
  const origin = JSON.parse(await readFile(`public${ammonia.origin.artifactPath}`, 'utf8'));
  assert.equal(origin.caseId, ammonia.id);
  assert.equal(origin.finding.status, 'needs_human');
  assert.equal(origin.draft.generatedByHunt, true);
  assert.equal(origin.limits.fullHuntReportRecovered, false);
  assert.equal(origin.draft.automaticallySubmitted, false);
  assert.ok(ammonia.regression.checks.length === 5);
  for (const locale of ['zh', 'en']) {
    const card = homepageEvidence(cases, content[locale].benchmarks.items).items.find((item) => item.id === ammonia.id);
    assert.match(card.d, /needs_human/);
    assert.match(card.d, locale === 'zh' ? /揭露草稿/ : /disclosure draft/);
    assert.match(card.d, locale === 'zh' ? /人工逐欄選編的節錄/ : /human-curated excerpt/);
    assert.match(card.d, /hunt\.json.*JSONL/);
    assert.doesNotMatch(card.d, /尚未綁定原始 Vettalon finding|No original Vettalon finding is bound/);
  }
});
