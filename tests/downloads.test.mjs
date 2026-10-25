import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DESKTOP_VERSION, FILES, classifyPlatform } from '../src/downloads.js';
import { downloadCopy } from '../src/download-copy.js';
import { content } from '../src/i18n.js';

const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const MAC_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const WIN_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const LINUX_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0';

test('every installer is a published asset of the one desktop version, with no Intel Mac build', () => {
  const base = `https://github.com/zhixuli0406/vettalon-releases/releases/download/desktop-v${DESKTOP_VERSION}/`;
  assert.deepEqual(Object.keys(FILES).sort(), ['appimage', 'deb', 'mac', 'windows']);
  for (const f of Object.values(FILES)) {
    assert.equal(f.url, base + f.name);
    assert.match(f.name, new RegExp(`^Vettalon_${DESKTOP_VERSION.replaceAll('.', '\\.')}_`));
    assert.match(f.sha256, /^[0-9a-f]{64}$/);
    assert.ok(Number.isInteger(f.bytes) && f.bytes > 1e6);
    assert.doesNotMatch(f.name, /x64\.dmg|x86_64-apple|intel/i);
  }
  assert.match(FILES.mac.name, /_aarch64\.dmg$/);
});

test('the chip decides the Mac answer; the Safari user agent alone is unknown', () => {
  assert.deepEqual(classifyPlatform({ userAgent: MAC_SAFARI }), { os: 'mac', arch: '' });
  assert.deepEqual(classifyPlatform({ userAgent: MAC_CHROME, uaPlatform: 'macOS', architecture: 'arm' }), { os: 'mac', arch: 'arm' });
  assert.deepEqual(classifyPlatform({ userAgent: MAC_CHROME, uaPlatform: 'macOS', architecture: 'x86' }), { os: 'mac', arch: 'x86' });
  assert.deepEqual(classifyPlatform({ userAgent: MAC_SAFARI, renderer: 'Apple M2 Pro' }), { os: 'mac', arch: 'arm' });
  assert.deepEqual(classifyPlatform({ userAgent: MAC_SAFARI, renderer: 'Intel(R) Iris(TM) Plus Graphics' }), { os: 'mac', arch: 'x86' });
  assert.deepEqual(classifyPlatform({ userAgent: MAC_SAFARI, renderer: 'Apple GPU' }), { os: 'mac', arch: '' });
});

test('other systems map to their installers or to no download', () => {
  assert.equal(classifyPlatform({ userAgent: WIN_CHROME, uaPlatform: 'Windows' }).os, 'windows');
  assert.equal(classifyPlatform({ userAgent: LINUX_FIREFOX }).os, 'linux');
  assert.equal(classifyPlatform({ userAgent: MAC_SAFARI, maxTouchPoints: 5 }).os, 'mobile');
  assert.equal(classifyPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/141.0 Mobile' }).os, 'mobile');
  assert.equal(classifyPlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }).os, 'mobile');
  assert.equal(classifyPlatform({ userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) Chrome/141.0' }).os, 'other');
});

test('pricing, FAQ and the download page say Intel Macs are not supported', () => {
  for (const [locale, intel] of [['zh', /不支援 Intel Mac/], ['en', /Intel Macs are not supported|not support Intel Macs/]]) {
    const c = content[locale];
    assert.match(c.editions.note, intel);
    assert.ok(c.editions.cards.filter((card) => /Pro|Team/.test(card.name)).every((card) => card.points.some((p) => /Intel/.test(p))));
    assert.ok(c.faq.items.some((item) => /Intel/.test(item.q)));
    assert.match(downloadCopy[locale].metaDescription, /Intel/);
    assert.match(downloadCopy[locale].metaDescription, new RegExp(DESKTOP_VERSION.replaceAll('.', '\\.')));
    assert.match(c.editions.download.label, new RegExp(DESKTOP_VERSION.replaceAll('.', '\\.')));
    assert.ok(c.footer.groups.flatMap((group) => group.links).some((link) => link.href === c.editions.download.href && link.t.includes(DESKTOP_VERSION)));
    assert.equal(c.editions.download.href, locale === 'en' ? '/en/download/' : '/download/');
  }
});

test('the site links to its own download page, never the GitHub releases page', async () => {
  for (const path of ['src/i18n.js', 'scripts/prerender.mjs', 'src/components/Editions.jsx']) {
    assert.doesNotMatch(await readFile(path, 'utf8'), /vettalon-releases\/releases\/latest/);
  }
});
