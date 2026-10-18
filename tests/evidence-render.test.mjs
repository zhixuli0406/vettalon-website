import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

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
      assert.ok(html.includes(item.upstreamCreditUrl));
      assert.equal((html.match(/<tbody>/g) || []).length, 1);
      assert.equal((html.match(/<tr>/g) || []).length, 6);
      assert.ok(html.includes(locale === 'en' ? 'Fixed-version regression verified' : '修補版回歸驗證'));
      assert.ok(html.includes(locale === 'en' ? 'Original discovery' : '原創發現'));
      assert.ok(!html.includes('null'));
    }
  } finally { await server.close(); }
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
