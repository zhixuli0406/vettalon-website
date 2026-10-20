import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatSupportEnd, supportEndFor } from '../src/support.js';
import { PLAN } from '../src/plan.js';
import { legal, LEGAL_PAGES } from '../src/legal.js';
import { content } from '../src/i18n.js';
import { downloadCopy } from '../src/download-copy.js';

test('the support period ends in the purchase month five years later (UTC)', () => {
  assert.equal(PLAN.supportYears, 5);
  assert.deepEqual(supportEndFor(new Date('2026-10-20T09:30:00Z')), { year: 2031, month: 10 });
  assert.deepEqual(supportEndFor(new Date('2026-12-31T23:59:59Z')), { year: 2031, month: 12 });
  assert.deepEqual(supportEndFor(new Date('2027-01-01T00:00:00Z')), { year: 2032, month: 1 });
  assert.deepEqual(supportEndFor(new Date('2028-02-29T12:00:00Z')), { year: 2033, month: 2 });
  assert.equal(formatSupportEnd({ year: 2031, month: 10 }, 'zh'), '2031 年 10 月底');
  assert.equal(formatSupportEnd({ year: 2031, month: 10 }, 'en'), 'the end of October 2031');
});

const all = (value) => JSON.stringify(value);

test('security updates are never sold as part of the Update Plan', () => {
  for (const locale of ['zh', 'en']) {
    const text = all([content[locale], legal[locale], downloadCopy[locale]]);
    assert.doesNotMatch(text, /Update Plan (includes|包含)[^.。]*(security|安全)/i, locale);
    assert.doesNotMatch(text, /CRA compliant|符合 CRA/i, locale);
  }
  assert.match(all(legal.zh.terms), /安全更新不屬於 Update Plan/);
  assert.match(all(legal.en.terms), /Security updates are not part of the Update Plan/);
  // Art. 13(10): a paid newer version means free fixes on the version the buyer can use.
  assert.match(all(legal.zh.terms), /為你不必付費就能使用的最新版本另外發布免費的安全修補/);
  assert.match(all(legal.en.terms), /free security fixes for the latest version you can use without paying/);
});

test('the support page is a public legal page in both languages', () => {
  assert.ok(LEGAL_PAGES.includes('support'));
  for (const locale of ['zh', 'en']) {
    const page = legal[locale].support;
    assert.ok(page.title && page.metaDescription && page.sections.length >= 5, locale);
    const text = all(page);
    assert.match(text, /info@dudustudio\.monster/);
    assert.match(text, /\.well-known\/security\.txt/);
    assert.ok(content[locale].footer.groups.some((g) => g.links.some((l) => l.href.endsWith('/support/'))), locale);
  }
});

test('the manufacturer postal address appears wherever the manufacturer is named with contact details', () => {
  const zh = '高雄市前鎮區一心二路42號3樓';
  const en = '3F., No. 42, Yixin 2nd Rd., Qianzhen Dist., Kaohsiung City 806002, Taiwan (R.O.C.)';
  for (const [locale, address] of [['zh', zh], ['en', en]]) {
    for (const page of ['terms', 'privacy', 'support']) {
      assert.ok(all(legal[locale][page].sections[0]).includes(address), `${locale} ${page}`);
    }
    assert.ok(content[locale].footer.company.includes(address), `${locale} footer`);
  }
});

test('public copy never names private repositories or embargoed cases', async () => {
  const sources = await Promise.all(['src/legal.js', 'src/i18n.js', 'src/download-copy.js', 'src/support.js', 'src/components/Editions.jsx']
    .map((path) => readFile(path, 'utf8')));
  for (const source of sources) {
    assert.doesNotMatch(source, /vettalon-pro|GHSA-(?!x43w)/i);
  }
});
