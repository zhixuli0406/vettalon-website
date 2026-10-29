import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { content } from '../src/i18n.js';
import { downloadCopy } from '../src/download-copy.js';
import { DESKTOP_VERSION } from '../src/downloads.js';

test('release copy describes source-bound verification in both locales', () => {
  for (const locale of ['zh', 'en']) {
    const c = content[locale];
    const text = JSON.stringify({ product: c.product, how: c.how, editions: c.editions, faq: c.faq });

    assert.match(text, /Python/);
    assert.match(text, locale === 'zh' ? /來源綁定/ : /source-bound/i);
    assert.match(text, locale === 'zh' ? /修補檢查/ : /fix check/i);
    assert.match(text, locale === 'zh' ? /不修改工作目錄/ : /No working-tree/i);
    assert.match(text, /incomplete/);
    assert.match(text, /exit 4/);
    assert.match(c.how.lead, locale === 'zh'
      ? /報告分列發生可能性與影響程度/
      : /Reports separate likelihood and impact/);
    assert.match(downloadCopy[locale].lead, new RegExp(DESKTOP_VERSION.replaceAll('.', '\\.')));
  }
});

test('hero copy states the supported scope and working-tree boundary', async () => {
  const hero = await readFile('src/components/Hero.jsx', 'utf8');
  assert.match(hero, /Python/);
  assert.match(hero, /不改你的工作目錄/);
  assert.match(hero, /without changing your working tree/);
});
