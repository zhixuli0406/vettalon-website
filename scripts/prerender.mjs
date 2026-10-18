// Prerender both locales to static HTML and generate SEO/GEO files.
// Runs after `vite build` (client) and `vite build --ssr` (server bundle).
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serializeJsonLd } from './json-ld.mjs';
import { validateDossierFiles } from './evidence-artifacts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const { content, LOCALE_META, SITE_URL, GITHUB, BUY_PRO, BUY_TEAM, DOWNLOADS, pagePath } = await import(join(root, 'src/i18n.js'));
const { legal, LEGAL_PAGES, LEGAL_NAME_EN, LEGAL_NAME_ZH } = await import(join(root, 'src/legal.js'));
const { PLAN } = await import(join(root, 'src/plan.js'));
const { cases } = await import(join(root, 'src/evidence/cases.js'));
const { render } = await import(join(root, 'dist-server/entry-server.js'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ORG = {
  '@type': 'Organization',
  name: LEGAL_NAME_ZH,
  legalName: LEGAL_NAME_EN,
  alternateName: '嘟嘟數位科技有限公司',
  url: 'https://www.dudustudio.monster/',
  email: 'info@dudustudio.monster',
};

function softwareApp(locale) {
  const c = content[locale];
  return {
    '@type': 'SoftwareApplication',
    name: 'Vettalon',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'macOS, Linux, Windows',
    description: c.meta.description,
    url: SITE_URL + LOCALE_META[locale].path,
    softwareHelp: GITHUB,
    downloadUrl: DOWNLOADS,
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Open-source core (Apache 2.0)' },
      { '@type': 'Offer', price: PLAN.proPrice.replace(/\D/g, ''), priceCurrency: 'USD', description: 'Vettalon Pro, one-time purchase', url: BUY_PRO },
      { '@type': 'Offer', price: PLAN.teamPrice.replace(/\D/g, ''), priceCurrency: 'USD', description: `Vettalon Team, per year, ${PLAN.teamSeats} seats`, url: BUY_TEAM },
    ],
    publisher: ORG,
    inLanguage: locale === 'en' ? 'en' : 'zh-Hant',
  };
}

function faqPage(locale) {
  const c = content[locale];
  return {
    '@type': 'FAQPage',
    inLanguage: locale === 'en' ? 'en' : 'zh-Hant',
    mainEntity: c.faq.items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

function jsonLd(locale, page) {
  if (page.startsWith('evidence')) return serializeJsonLd({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: metaFor(locale,page).title, url: SITE_URL + pagePath(locale,page), inLanguage: locale === 'en' ? 'en' : 'zh-Hant' });
  const lang = locale === 'en' ? 'en' : 'zh-Hant';
  const graph = page
    ? [ORG, { '@type': 'WebPage', name: legal[locale][page].title, url: SITE_URL + pagePath(locale, page), inLanguage: lang, publisher: ORG }]
    : [ORG, softwareApp(locale), faqPage(locale)];
  return serializeJsonLd({ '@context': 'https://schema.org', '@graph': graph });
}

// Title/description per page: legal pages use their own, the landing page the site meta.
function metaFor(locale, page) {
  const c = content[locale];
  if (!page) return { title: c.meta.title, description: c.meta.description };
  if (page.startsWith('evidence')) {
    const item = cases.find(c => page === 'evidence/' + c.id);
    return { title: (item ? item.package + ' · ' + (item.cve ?? item.ghsa) + ' | ' : '') + (locale === 'en' ? 'Evidence wall | Vettalon' : '證據牆｜Vettalon'), description: item ? item.summary[locale] : (locale === 'en' ? 'Public case evidence with sources, methods, and verification limits.' : '公開逐案證據，附來源、測試方法與驗證限制。') };
  }
  const doc = legal[locale][page];
  return { title: doc.title + (locale === 'en' ? ' | ' : '｜') + 'Vettalon', description: doc.metaDescription };
}

function headFor(locale, page) {
  const c = content[locale];
  const lm = LOCALE_META[locale];
  const m = metaFor(locale, page);
  const url = SITE_URL + pagePath(locale, page);
  const altZh = SITE_URL + pagePath('zh', page);
  const altEn = SITE_URL + pagePath('en', page);
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="keywords" content="${esc(c.meta.keywords)}" />`,
    `<meta name="author" content="嘟嘟數位科技有限公司" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="zh-Hant" href="${altZh}" />`,
    `<link rel="alternate" hreflang="en" href="${altEn}" />`,
    `<link rel="alternate" hreflang="x-default" href="${altZh}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:image" content="${SITE_URL}/og.png?v=c1-color" />`,
    `<meta property="og:site_name" content="Vettalon" />`,
    `<meta property="og:locale" content="${lm.ogLocale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/og.png?v=c1-color" />`,
    `<script type="application/ld+json">${jsonLd(locale, page)}</script>`,
  ].join('\n    ');
}

const template = await readFile(join(dist, 'index.html'), 'utf8');

const PAGES = ['', ...LEGAL_PAGES, 'evidence', ...cases.map(c => 'evidence/' + c.id)];

async function writePage(locale, page) {
  const lm = LOCALE_META[locale];
  const appHtml = render(locale, page);
  const html = template
    .replace('<!--app-head-->', headFor(locale, page))
    .replace('<!--app-html-->', appHtml)
    .replace('<html lang="zh-Hant">', `<html lang="${lm.lang}">`);
  const path = pagePath(locale, page);
  const dir = join(dist, path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html);
  console.log(`prerendered ${locale} → ${path}`);
}

for (const locale of Object.keys(LOCALE_META)) {
  for (const page of PAGES) await writePage(locale, page);
}

// Validate copied public artifacts and generate records only from the reviewed manifest.
await validateDossierFiles(cases, dist);
await mkdir(join(dist,'evidence/records'), { recursive: true });
for (const item of cases) await writeFile(join(dist,'evidence/records',item.id + '.json'), JSON.stringify(item,null,2) + '\n');
await writeFile(join(dist,'evidence/records/index.json'), JSON.stringify(cases,null,2) + '\n');

// ── SEO/GEO files ──────────────────────────────────────────────────────────
const urls = PAGES.flatMap((page) =>
  Object.keys(LOCALE_META).map((locale) => ({ page, loc: SITE_URL + pagePath(locale, page) })),
);

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n` +
        `    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${SITE_URL}${pagePath('zh', u.page)}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${pagePath('en', u.page)}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${pagePath('zh', u.page)}" />\n` +
        `    <changefreq>monthly</changefreq>\n    <priority>${u.page ? '0.3' : '1.0'}</priority>\n  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`;
await writeFile(join(dist, 'sitemap.xml'), sitemap);

const robots =
  `# Vettalon — ${SITE_URL}\n` +
  `User-agent: *\nAllow: /\n\n` +
  `# AI / GEO crawlers are welcome to read and cite this site.\n` +
  ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'CCBot', 'Bytespider', 'Applebot-Extended']
    .map((b) => `User-agent: ${b}\nAllow: /`)
    .join('\n') +
  `\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
await writeFile(join(dist, 'robots.txt'), robots);

// llms.txt — short machine-readable index for AI search (GEO).
function llms(locale) {
  const c = content[locale];
  const L = (zh, en) => (locale === 'en' ? en : zh);
  return (
    `# Vettalon\n\n` +
    `> ${c.meta.description}\n\n` +
    `${L('官網', 'Site')}: ${SITE_URL}/${locale === 'en' ? 'en/' : ''}\n` +
    `${L('原始碼', 'Source')}: ${GITHUB}\n\n` +
    `## ${L('核心能力', 'Capabilities')}\n` +
    c.product.cards.map((x) => `- ${x.name}: ${x.desc}`).join('\n') +
    `\n\n## ${L('價格', 'Pricing')}\n` +
    c.editions.cards.map((x) => `- ${x.name}: ${x.price}. ${x.priceNote}`).join('\n') +
    `\n${c.editions.note}\n` +
    `${L('服務條款', 'Terms')}: ${SITE_URL}${pagePath(locale, 'terms')} · ` +
    `${L('隱私權政策', 'Privacy')}: ${SITE_URL}${pagePath(locale, 'privacy')} · ` +
    `${L('退款政策', 'Refunds')}: ${SITE_URL}${pagePath(locale, 'refund')}` +
    `\n\n## ${L('案例證據', 'Case evidence')}\n` +
    c.benchmarks.items.map((x) => `- ${x.v} ${x.k}: ${x.d}`).join('\n') +
    `\n\n## FAQ\n` +
    c.faq.items.map((x) => `### ${x.q}\n${x.a}`).join('\n\n') +
    `\n`
  );
}
await writeFile(join(dist, 'llms.txt'), llms('zh'));
await writeFile(join(dist, 'llms-full.txt'), llms('zh') + '\n---\n\n' + llms('en'));

console.log('SEO files: sitemap.xml, robots.txt, llms.txt, llms-full.txt');
