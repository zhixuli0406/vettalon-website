// Pre-deploy check: every installer on /download/ must be publicly
// downloadable with the listed size (and, with --sha, the listed SHA-256).
// A draft release answers 404 here, so the page cannot ship ahead of it.
import { createHash } from 'node:crypto';
import { FILES } from '../src/downloads.js';

const withSha = process.argv.includes('--sha');
let failed = false;
for (const [key, f] of Object.entries(FILES)) {
  let verdict;
  try {
    const res = await fetch(f.url, { method: withSha ? 'GET' : 'HEAD', redirect: 'follow' });
    if (!res.ok) verdict = `HTTP ${res.status}`;
    else if (!withSha) {
      const size = Number(res.headers.get('content-length'));
      verdict = size === f.bytes ? 'ok' : `size ${size} != ${f.bytes}`;
    } else {
      const bytes = Buffer.from(await res.arrayBuffer());
      const sha = createHash('sha256').update(bytes).digest('hex');
      verdict = bytes.length !== f.bytes ? `size ${bytes.length} != ${f.bytes}` : sha !== f.sha256 ? 'sha256 mismatch' : 'ok';
    }
  } catch (error) {
    verdict = `unreachable (${error.cause?.code ?? error.name})`;
  }
  if (verdict !== 'ok') failed = true;
  console.log(`${verdict === 'ok' ? 'ok  ' : 'FAIL'} ${key} ${f.name} ${verdict === 'ok' ? '' : verdict}`);
}
process.exit(failed ? 1 : 0);
