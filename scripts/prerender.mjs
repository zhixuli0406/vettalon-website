// Prerender both locales to static HTML and generate SEO/GEO files.
// Runs after `vite build` (client) and `vite build --ssr` (server bundle).
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const { content, LOCALE_META, SITE_URL, GITHUB } = await import(join(root, 'src/i18n.js'));
const { render } = await import(join(root, 'dist-server/entry-server.js'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ORG = {
  '@type': 'Organization',
  name: '嘟嘟數位科技有限公司',
  alternateName: 'DuDu Studio',
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
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Open-source core (Apache 2.0)' },
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

function jsonLd(locale) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [ORG, softwareApp(locale), faqPage(locale)],
  });
}

function headFor(locale) {
  const c = content[locale];
  const lm = LOCALE_META[locale];
  const url = SITE_URL + lm.path;
  const altZh = SITE_URL + LOCALE_META.zh.path;
  const altEn = SITE_URL + LOCALE_META.en.path;
  return [
    `<title>${esc(c.meta.title)}</title>`,
    `<meta name="description" content="${esc(c.meta.description)}" />`,
    `<meta name="keywords" content="${esc(c.meta.keywords)}" />`,
    `<meta name="author" content="嘟嘟數位科技有限公司" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="zh-Hant" href="${altZh}" />`,
    `<link rel="alternate" hreflang="en" href="${altEn}" />`,
    `<link rel="alternate" hreflang="x-default" href="${altZh}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(c.meta.title)}" />`,
    `<meta property="og:description" content="${esc(c.meta.description)}" />`,
    `<meta property="og:image" content="${SITE_URL}/og.png" />`,
    `<meta property="og:site_name" content="Vettalon" />`,
    `<meta property="og:locale" content="${lm.ogLocale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(c.meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(c.meta.description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/og.png" />`,
    `<script type="application/ld+json">${jsonLd(locale)}</script>`,
  ].join('\n    ');
}

const template = await readFile(join(dist, 'index.html'), 'utf8');

async function writeLocale(locale) {
  const lm = LOCALE_META[locale];
  const appHtml = render(locale);
  let html = template
    .replace('<!--app-head-->', headFor(locale))
    .replace('<!--app-html-->', appHtml)
    .replace('<html lang="zh-Hant">', `<html lang="${lm.lang}">`);
  if (locale === 'zh') {
    await writeFile(join(dist, 'index.html'), html);
  } else {
    await mkdir(join(dist, 'en'), { recursive: true });
    await writeFile(join(dist, 'en/index.html'), html);
  }
  console.log(`prerendered ${locale} → ${lm.path}`);
}

for (const locale of Object.keys(LOCALE_META)) await writeLocale(locale);

// ── SEO/GEO files ──────────────────────────────────────────────────────────
const urls = [
  { loc: SITE_URL + '/', lang: 'zh-Hant', alt: SITE_URL + '/en/' },
  { loc: SITE_URL + '/en/', lang: 'en', alt: SITE_URL + '/' },
];

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n` +
        `    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${SITE_URL}/" />\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />\n` +
        `    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
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
    `\n\n## ${L('基準', 'Benchmarks')}\n` +
    c.benchmarks.items.map((x) => `- ${x.v} ${x.k}: ${x.d}`).join('\n') +
    `\n\n## FAQ\n` +
    c.faq.items.map((x) => `### ${x.q}\n${x.a}`).join('\n\n') +
    `\n`
  );
}
await writeFile(join(dist, 'llms.txt'), llms('zh'));
await writeFile(join(dist, 'llms-full.txt'), llms('zh') + '\n---\n\n' + llms('en'));

console.log('SEO files: sitemap.xml, robots.txt, llms.txt, llms-full.txt');
