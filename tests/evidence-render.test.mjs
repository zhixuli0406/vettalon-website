import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { validateManifest } from '../src/evidence/schema.js';

// Test-only module instances; this fixture is never written to the public manifest.
async function renderer() {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const [{ default: EvidencePage }, { LocaleCtx }, { cases }] = await Promise.all([
    server.ssrLoadModule('/src/components/EvidencePage.jsx'),
    server.ssrLoadModule('/src/locale.js'),
    server.ssrLoadModule('/src/evidence/cases.js'),
  ]);
  return { server, cases, render: (locale, id) => renderToStaticMarkup(React.createElement(LocaleCtx.Provider, { value: { locale } }, React.createElement(EvidencePage, { page: `evidence/${id}` }))) };
}

test('a private reproduced fixture exposes artifact, digest, three controls and upstream credit in both locales', async () => {
  const { server, cases, render } = await renderer();
  try {
    const item = structuredClone(cases[0]);
    item.id = 'private-renderer-fixture'; item.type = 'discovery'; item.status = 'reproduced';
    item.upstreamCreditUrl = 'https://github.com/example/fixture/security/advisories/GHSA-abcd-efgh-ijkl';
    item.reproduction = { mode: 'differential', artifactUrl: 'https://vettalon.dudustudio.monster/evidence/test-only-artifact.json', sha256: 'b'.repeat(64), vulnerable: 'pass', fixed: 'pass', control: 'pass' };
    cases.push(item);
    for (const locale of ['zh', 'en']) {
      const html = render(locale, item.id);
      assert.ok(html.includes(item.reproduction.artifactUrl), 'Public artifact must be directly reachable from detail');
      assert.ok(html.includes(item.reproduction.sha256), 'Artifact digest must be visible independently of detection digest');
      assert.ok(html.includes(item.upstreamCreditUrl), 'Original discovery attribution must be reachable');
      for (const label of locale === 'en' ? ['Vulnerable effect', 'Fixed effect', 'Normal control'] : ['脆弱版本效果', '修補版本效果', '正常控制']) assert.ok(html.includes(label), label);
      assert.equal((html.match(/>pass</g) || []).length, 3);
    }
  } finally { await server.close(); }
});

test('historical detection keeps its finding verdict and never displays reproduction success', async () => {
  const { server, cases, render } = await renderer();
  try {
    for (const locale of ['zh', 'en']) {
      const html = render(locale, cases[0].id);
      assert.ok(html.includes(cases[0].detection.findingStatus));
      assert.ok(html.includes(locale === 'en' ? 'Detection match (historical test)' : '識別命中（歷史測試）'));
      assert.ok(!html.includes(locale === 'en' ? 'Differential reproduction passed' : '差分重現通過'));
      assert.ok(!html.includes('test-only-artifact'));
    }
  } finally { await server.close(); }
});

test('both real historical cases expose their own dossier digest and preserve scan completeness', async () => {
  const { server, cases, render } = await renderer();
  try {
    const historical = cases.filter(item => item.type === 'historical');
    assert.equal(historical.length, 2);
    for (const item of historical) for (const locale of ['zh', 'en']) {
      const html = render(locale, item.id);
      assert.ok(html.includes(item.dossier.artifactPath));
      assert.ok(html.includes(item.dossier.sha256));
      assert.notEqual(item.dossier.sha256, item.detection.sha256);
      assert.ok(html.includes(item.detection.sha256));
      assert.ok(html.includes(item.dossier.runStatus));
      if (item.dossier.incompleteReason) assert.ok(html.includes(item.dossier.incompleteReason));
      assert.ok(html.includes(locale === 'en' ? 'The original report is not public.' : '原始報告不公開'));
    }
  } finally { await server.close(); }
});

test('ammonia discovery detail shows product-origin artifact, five policy checks and bounded credit', async () => {
  const { server, cases, render } = await renderer();
  try {
    const item = cases.find(value => value.id === 'ammonia-ghsa-x43w-36pp-96g3');
    for (const locale of ['zh', 'en']) {
      const html = render(locale, item.id);
      assert.ok(html.includes(item.ghsa));
      assert.ok(html.includes(item.regression.artifactPath));
      assert.ok(html.includes(item.regression.sha256));
      assert.ok(html.includes(item.origin.artifactPath));
      assert.ok(html.includes(item.origin.sha256));
      assert.ok(html.includes(item.pairedBundle.artifactPath));
      assert.ok(html.includes(item.pairedBundle.sha256));
      assert.ok(html.includes(item.upstreamCreditUrl));
      assert.ok(html.includes(locale === 'en' ? 'not the original Vettalon hunt' : '不是原始 Vettalon 獵捕紀錄'));
      assert.equal((html.match(/<tbody>/g) || []).length, 1);
      assert.equal((html.match(/<tr>/g) || []).length, 6);
      assert.ok(html.includes(locale === 'en' ? 'Fixed-version regression verified' : '修補版回歸驗證'));
      assert.ok(html.includes(locale === 'en' ? 'Original discovery' : '原創發現'));
      assert.ok(!html.includes('null'));
    }
  } finally { await server.close(); }
});

test('list shows each real case evidence types without claiming historical comparison', async () => {
  const { server, cases, render } = await renderer();
  try {
    for (const locale of ['zh', 'en']) {
      const html = render(locale, '');
      for (const item of cases) {
        assert.ok(html.includes(`aria-label="${locale === 'zh' ? '可核對的證據類型' : 'Available evidence types'}"`));
        assert.ok(html.includes(item.title[locale]));
      }
      assert.equal((html.match(/data-state="missing"/g) || []).length, 2, 'both historical rows must disclose missing comparisons');
      assert.ok(html.includes(locale === 'zh' ? '版本回歸摘要' : 'Version regression summary'));
      assert.ok(html.includes(locale === 'zh' ? '未提供修補版對照' : 'No fixed-version comparison'));
    }
  } finally { await server.close(); }
});

test('four-stage chain links real case evidence and keeps missing work explicit in both locales', async () => {
  const { server, cases, render } = await renderer();
  try {
    const ammonia = cases.find(item => item.origin && item.regression);
    for (const locale of ['zh', 'en']) {
      const html = render(locale, ammonia.id);
      const chain = html.match(/<section class="evidence__chain"[\s\S]*?<\/section>/)?.[0];
      assert.ok(chain, 'chain appears before long case detail');
      const headings = locale === 'zh' ? ['產品觀測', '人工／上游歸屬', '修補對照', '未驗證範圍'] : ['Product observation', 'Human / upstream attribution', 'Fixed-version comparison', 'Unverified scope'];
      let previous = -1;
      for (const heading of headings) {
        const position = chain.indexOf(heading);
        assert.ok(position > previous, `${heading} appears in sequence`);
        previous = position;
      }
      for (const href of [ammonia.origin.artifactPath, ammonia.upstreamCreditUrl, ammonia.regression.artifactPath, '#evidence-limits']) assert.ok(chain.includes(`href="${href}"`), href);
      assert.ok(html.includes('id="evidence-limits"'));
      assert.ok(chain.includes('needs_human'));
      assert.ok(chain.includes(ammonia.limitations[locale].slice(0, 24)), 'the unverified stage states the case-specific limit');
      assert.ok(!chain.includes('data-state="missing"'));
    }
    for (const item of cases.filter(value => value.type === 'historical')) for (const locale of ['zh', 'en']) {
      const html = render(locale, item.id);
      const chain = html.match(/<section class="evidence__chain"[\s\S]*?<\/section>/)?.[0];
      assert.ok(chain.includes(`href="${item.dossier.artifactPath}"`));
      assert.ok(chain.includes(`href="${item.advisoryUrl}"`));
      assert.ok(chain.includes(`href="${item.fixUrl}"`));
      assert.ok(chain.includes('data-state="missing"'));
      assert.ok(chain.includes(locale === 'zh' ? '未執行脆弱版與修補版' : 'no vulnerable-versus-fixed'));
      assert.ok(chain.includes(locale === 'zh' ? '不代表原創發現' : 'not an original discovery'));
    }
  } finally { await server.close(); }
});

test('schema-valid reported and reproduced cases without original product artifacts fail closed in both locales', async () => {
  const { server, cases, render } = await renderer();
  const originalLength = cases.length;
  try {
    const reported = structuredClone(cases.find(item => item.origin && item.regression));
    reported.id = 'reported-without-product-output';
    reported.type = 'reported';
    reported.title = { zh: '只有回歸摘要的測試案例', en: 'Reported fixture with regression only' };
    reported.credit = { zh: '上游公開記錄列出通報者。', en: 'The upstream public record names the reporter.' };
    delete reported.origin;
    delete reported.pairedBundle;
    reported.regression.artifactPath = `/evidence/regressions/${reported.id}.json`;

    const reproduced = structuredClone(cases.find(item => item.type === 'historical'));
    reproduced.id = 'discovery-without-product-output';
    reproduced.type = 'discovery';
    reproduced.status = 'reproduced';
    reproduced.title = { zh: '只有差分附件的測試案例', en: 'Discovery fixture with differential only' };
    reproduced.credit = { zh: '歸屬以公開上游資料為準。', en: 'Attribution follows the public upstream record.' };
    reproduced.upstreamCreditUrl = reproduced.advisoryUrl;
    reproduced.reproduction = { mode: 'differential', artifactUrl: 'https://vettalon.dudustudio.monster/evidence/test-only-artifact.json', sha256: 'b'.repeat(64), vulnerable: 'pass', fixed: 'pass', control: 'pass' };
    delete reproduced.detection;
    delete reproduced.dossier;
    for (const item of [reported, reproduced]) validateManifest([item]);
    cases.push(reported, reproduced);

    for (const locale of ['zh', 'en']) {
      const list = render(locale, '');
      for (const item of [reported, reproduced]) {
        const row = [...list.matchAll(/<article class="evidence__row"[\s\S]*?<\/article>/g)].map(match => match[0]).find(value => value.includes(item.title[locale]));
        assert.ok(row, 'fixture appears in list');
        assert.ok(row.includes(`<li data-state="missing">${locale === 'zh' ? '未提供可核對的產品輸出' : 'No verifiable product output provided'}</li>`));
        assert.ok(row.includes(`<li data-state="available">${locale === 'zh' ? '人工整理紀錄（非原始輸出）' : 'Curated record (not original output)'}</li>`));

        const detail = render(locale, item.id);
        const chain = detail.match(/<section class="evidence__chain"[\s\S]*?<\/section>/)?.[0];
        assert.ok(chain);
        const observation = chain.match(/<ol class="evidence__chain-steps"><li data-state="missing">[\s\S]*?<\/li>/)?.[0];
        assert.ok(observation?.includes(locale === 'zh' ? '沒有公開的原始產品輸出附件' : 'no public original product-output artifact'));
        assert.ok(!observation.includes('<a '), 'curated record is not linked as product observation');
        assert.ok(chain.includes('class="evidence__curated-record"'));
        assert.ok(chain.includes(`href="/evidence/records/${item.id}.json"`));
        assert.ok(chain.includes(item.type === 'reported' ? item.regression.artifactPath : item.reproduction.artifactUrl));
      }
    }
  } finally { cases.length = originalLength; await server.close(); }
});

test('SSR keeps original excerpts unverified behind a user-triggered preview button', async () => {
  const { server, cases, render } = await renderer();
  try {
    for (const locale of ['zh','en']) {
      const html=render(locale,cases[0].id);
      assert.ok(html.includes(locale==='en'?'View original excerpt':'查看原文節錄'));
      assert.ok(!html.includes('filepath = self._directory.joinpath(filename).resolve()'));
      assert.ok(!html.includes('data-evidence-verified="true"'));
    }
  } finally {await server.close();}
});

test('the verified excerpt renderer shows real finding/review boundaries and escapes original text', async () => {
  const { server, cases }=await renderer();
  try {
    const { DossierExcerpt }=await server.ssrLoadModule('/src/components/DossierPreview.jsx');
    const { LocaleCtx }=await server.ssrLoadModule('/src/locale.js');
    const { readFile }=await import('node:fs/promises');
    for (const item of cases.filter(item => item.dossier)) for (const locale of ['zh','en']) {
      const dossier=JSON.parse(await readFile('public'+item.dossier.artifactPath,'utf8'));
      dossier.finding.title='<img src=x onerror=alert(1)> TEST_ONLY_ORIGINAL';
      const html=renderToStaticMarkup(React.createElement(LocaleCtx.Provider,{value:{locale}},React.createElement(DossierExcerpt,{dossier})));
      assert.ok(!html.includes('<img'));
      assert.ok(html.includes('&lt;img'));
      assert.ok(html.includes(dossier.review.verdict));
      assert.ok(html.includes(dossier.finding.status));
      assert.ok(html.includes(dossier.finding.reportedFileSha256));
      if(item.id.startsWith('phpunit')) {
        assert.ok(html.includes('units_failed'));
        assert.ok(html.includes(locale==='en'?'excluded in full':'整段省略'));
      } else assert.ok(html.includes('plausible:'));
    }
  } finally {await server.close();}
});
