// Render scripts/og/og.html to public/og.png (1200x630) with headless Chrome.
// Usage: npm run og   (set CHROME=/path/to/chrome to override the binary)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const template = join(root, 'scripts/og/og.html');
const out = join(root, 'public/og.png');

const candidates = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error('make-og: no Chrome binary found; set CHROME=/path/to/chrome');
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'og-chrome-'));
try {
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`,
    '--window-size=1200,630',
    `--screenshot=${out}`,
    pathToFileURL(template).href,
  ], { stdio: 'inherit' });
} finally {
  rmSync(profile, { recursive: true, force: true });
}
console.log(`make-og: wrote ${out}`);
