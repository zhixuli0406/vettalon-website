import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPrismGeometry, opticalPaths } from '../src/prism/scene.js';
import { render } from '../dist-server/entry-server.js';

const root = new URL('../', import.meta.url);

test('the optical object is a closed solid with real depth, finite normals and nonzero volume', () => {
  const geometry = createPrismGeometry();
  try {
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    assert.ok(positions.count > 12);
    assert.equal(normals.count, positions.count);
    assert.ok([...positions.array, ...normals.array].every(Number.isFinite));
    geometry.computeBoundingBox();
    assert.ok(geometry.boundingBox.max.z - geometry.boundingBox.min.z > 1);
    const edges = new Map();
    let sixVolume = 0;
    const point = (i) => [positions.getX(i), positions.getY(i), positions.getZ(i)];
    const key = (p) => p.map((v) => v.toFixed(5)).join(',');
    for (let i = 0; i < positions.count; i += 3) {
      const [a, b, c] = [point(i), point(i + 1), point(i + 2)];
      sixVolume += a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
      for (const [start, end] of [[a, b], [b, c], [c, a]]) {
        const edge = [key(start), key(end)].sort().join('|');
        edges.set(edge, (edges.get(edge) || 0) + 1);
      }
    }
    assert.ok(Math.abs(sixVolume / 6) > 4);
    for (const incidence of edges.values()) assert.equal(incidence, 2, 'every geometric edge has two incident faces');
  } finally { geometry.dispose(); }
});

test('review paths remain joined while challenge branches become visible and human review selects an output', () => {
  const finder = opticalPaths(0);
  const verifier = opticalPaths(1);
  const human = opticalPaths(2);
  for (const paths of [finder, verifier, human]) {
    assert.deepEqual(paths.incoming.at(-1), paths.refracted[0]);
    for (const output of paths.outputs) assert.deepEqual(paths.refracted.at(-1), output[0]);
    assert.ok([...paths.incoming.flat(), ...paths.refracted.flat(), ...paths.outputs.flat(2)].every(Number.isFinite));
    assert.ok(paths.weights.every((weight) => weight >= 0 && weight <= 1));
  }
  assert.equal(finder.weights.filter((v) => v > 0).length, 1);
  assert.ok(verifier.weights.every((v) => v > 0));
  assert.ok(human.weights[0] > human.weights[1] * 5 && human.weights[0] > human.weights[2] * 5);
});

test('both languages put the complete poster before the review chapter and retain readable SSR without a canvas', () => {
  for (const locale of ['zh', 'en']) {
    const html = render(locale, '');
    assert.ok(html.indexOf('id="prism-hero"') < html.indexOf('id="review"'));
    assert.ok(html.includes('id="prism-visual"'));
    assert.ok(html.includes('data-status="poster"'));
    assert.ok(html.includes('/brand/prism-poster.png'));
    assert.ok(html.includes('/brand/prism-poster-dark.png'));
    assert.ok(html.includes('data-prism-stage="0"'));
    assert.ok(html.includes('class="review-demo__fallback"'));
    assert.ok(!html.includes('<canvas'));
    assert.ok(!html.includes('prism-controls__motion'), 'non-ready SSR must not expose inactive renderer controls');
    assert.ok(html.includes(locale === 'zh' ? '非掃描結果' : 'not scan output'));
  }
});

test('all poster and self-hosted font references resolve locally with attribution', async () => {
  for (const name of ['prism-poster.png', 'prism-poster-dark.png']) {
    const png = await readFile(new URL(`dist/brand/${name}`, root));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 900);
  }
  const font = await readFile(new URL('dist/fonts/UncutSans-Variable.woff2', root));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  const license = await readFile(new URL('dist/fonts/UncutSans-LICENSE.txt', root), 'utf8');
  assert.match(license, /SIL OPEN FONT LICENSE Version 1.1/);
  const page = await readFile(new URL('dist/index.html', root), 'utf8');
  assert.match(page, /rel="preload"[^>]*UncutSans-Variable\.woff2/);
  assert.doesNotMatch(page, /fonts\.googleapis|fonts\.gstatic|unpkg\.com|jsdelivr/);
});

test('the decision journey follows the same semantic reading order in both languages', () => {
  for (const locale of ['zh', 'en']) {
    const html = render(locale, '');
    const ordered = ['id="hero-title"', 'id="prism-visual"', 'data-review-demo', 'id="report"', 'id="benchmarks"', 'id="product"', 'id="how"', 'id="editions"', 'id="faq"', 'id="contact"'];
    let previous = -1;
    for (const marker of ordered) {
      const at = html.indexOf(marker);
      assert.ok(at > previous, `${locale}: ${marker} must follow the previous decision`);
      previous = at;
    }
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<main id="main-content" tabindex="-1"/);
    assert.match(html, /class="review-verdict" role="status" aria-live="polite" aria-atomic="true"/);
    assert.match(html, /class="real-sample" open=""/);
    assert.ok(html.includes('href="#report"'));
    assert.ok(html.includes('class="prism-stage" tabindex="-1"'));
    assert.ok(!html.includes('prism-stage__identity'));
  }
});
