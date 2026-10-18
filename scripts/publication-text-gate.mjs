import { lstat, readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const textExtensions = new Set([
  '.css', '.csv', '.html', '.js', '.json', '.map', '.md', '.mjs',
  '.svg', '.txt', '.webmanifest', '.xml', '.yaml', '.yml',
]);
const binaryExtensions = new Set(['.gif', '.ico', '.jpeg', '.jpg', '.png', '.webp', '.woff', '.woff2']);
const privateContent = [
  /DO_NOT_PUBLISH_PRIVATE_SENTINEL|PRIVATE_PREVIEW_SENTINEL|SECRET_SENTINEL/,
  /\/Users\/|\/home\/|(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/]|\\\\[^\\\s]+\\[^\\\s]+/i,
  /github\.com\/zhixuli0406\/vettalon-pro(?:[\/#?]|$)/i,
];

async function scan(directory) {
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error('unsafe entry');
    if (info.isDirectory()) { await scan(path); continue; }
    if (!info.isFile()) throw new Error('unsafe entry');
    const extension = extname(entry).toLowerCase();
    if (binaryExtensions.has(extension)) continue;
    if (!textExtensions.has(extension)) throw new Error('unknown asset type');
    // Invalid UTF-8 is unsafe in a publication text asset. Do not log its bytes.
    const source = new TextDecoder('utf-8', { fatal: true }).decode(await readFile(path));
    if (privateContent.some((pattern) => pattern.test(source))) throw new Error('unsafe text');
  }
}

try {
  if (process.argv.length > 3) throw new Error('unexpected arguments');
  await scan(process.argv[2] ?? 'dist');
  console.log('Public output text gate passed.');
} catch {
  // Never print rejected content or paths: they may contain private disclosure data.
  console.error('Public output text gate failed.');
  process.exitCode = 1;
}
