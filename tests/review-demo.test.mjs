import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { initialReviewState, reviewReducer, reviewCopy } from '../src/review-demo.js';
import { render } from '../dist-server/entry-server.js';
import { content, BUY_PRO, BUY_TEAM } from '../src/i18n.js';
import { cases } from '../src/evidence/cases.js';
import { homepageEvidence } from '../src/evidence/homepage.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const transition = (state, ...actions) => actions.reduce(reviewReducer, state);

test('a candidate moves through a review without silently claiming a confirmed vulnerability', () => {
  let state = initialReviewState;
  assert.match(reviewCopy.en.cases[0].states[state.stage].status, /Candidate/);
  state = reviewReducer(state, { type: 'next' });
  assert.equal(state.stage, 1);
  assert.match(reviewCopy.en.cases[0].states[state.stage].status, /further validation/);
  state = reviewReducer(state, { type: 'next' });
  assert.equal(state.stage, 2);
  assert.equal(reviewCopy.en.cases[0].states[state.stage].status, 'Needs human review');
  assert.match(reviewCopy.en.cases[0].states[state.stage].reason, /No PoC runs/);
  assert.equal(reviewReducer(state, { type: 'next' }).stage, 0);
});

test('switching candidates resets the stage and closes previously revealed reasoning', () => {
  const revealed = transition(initialReviewState, { type: 'stage', stage: 2 }, { type: 'reason' });
  assert.equal(revealed.expanded, true);
  const state = reviewReducer(revealed, { type: 'case', id: 'parameter' });
  assert.deepEqual(state, { caseId: 'parameter', stage: 0, expanded: false });
  assert.equal(reviewReducer(state, { type: 'reason' }).expanded, true);
  assert.equal(transition(state, { type: 'reason' }, { type: 'stage', stage: 1 }).expanded, false);
});

test('parameter binding gets a qualified refutation while missing authorization context stays uncertain', () => {
  const parameter = reviewCopy.en.cases.find((item) => item.id === 'parameter');
  const access = reviewCopy.en.cases.find((item) => item.id === 'access');
  assert.match(parameter.states[1].status, /refuted/);
  assert.match(parameter.states[1].reason, /assumes.*binding correctly/);
  assert.equal(access.states[1].status, 'Insufficient context');
  assert.match(access.states[1].reason, /neither a confirmed vulnerability nor proof of safety/);
  assert.match(access.states[2].status, /Human context/);
});

test('invalid candidate IDs or stage indexes cannot corrupt the displayed example', () => {
  for (const action of [{ type: 'case', id: 'live-scan' }, { type: 'stage', stage: -1 }, { type: 'stage', stage: 3 }, { type: 'stage', stage: 1.5 }, { type: 'unknown' }]) {
    assert.equal(reviewReducer(initialReviewState, action), initialReviewState);
  }
});

test('Chinese and English expose the same example code, cases and complete review branches', () => {
  assert.equal(reviewCopy.zh.cases.length, 3);
  assert.deepEqual(reviewCopy.zh.cases.map((item) => item.id), reviewCopy.en.cases.map((item) => item.id));
  for (const locale of ['zh', 'en']) {
    const copy = reviewCopy[locale];
    assert.equal(copy.stages.length, 3);
    for (const [index, candidate] of copy.cases.entries()) {
      assert.deepEqual(candidate.code, reviewCopy.en.cases[index].code);
      assert.equal(candidate.states.length, 3);
      for (const stage of candidate.states) assert.ok(stage.status && stage.title && stage.body && stage.reason);
    }
  }
});

test('SSR provides real disclosure content without requiring JavaScript', () => {
  for (const locale of ['zh', 'en']) {
    const html = render(locale, '');
    const copy = reviewCopy[locale];
    assert.ok(html.includes(copy.disclaimer));
    assert.ok(html.includes('class="review-demo__fallback"'));
    assert.ok(html.includes(copy.fallback));
    for (const item of copy.cases) {
      for (const stage of item.states) assert.ok(html.includes(stage.status));
    }
    assert.ok(html.includes('aria-controls="review-reason"'));
    assert.ok(html.includes('aria-expanded="false"'));
    assert.ok(html.includes('id="review-reason" class="review-reason" hidden=""'));
    assert.ok(html.includes('fixtures/demo-app'));
    assert.ok(html.includes(content[locale].hero.terminalCaption));
  }
});

test('the redesign retains every homepage anchor, public case link and paid checkout destination', () => {
  for (const locale of ['zh', 'en']) {
    const html = render(locale, '');
    for (const id of ['product', 'how', 'benchmarks', 'editions', 'faq', 'contact']) assert.ok(html.includes(`id="${id}"`));
    for (const item of homepageEvidence(cases, content[locale].benchmarks.items).items) {
      assert.ok(html.includes(item.v));
      assert.ok(html.includes(item.k));
      assert.ok(html.includes(item.d));
      assert.ok(html.includes(`${locale === 'en' ? '/en' : ''}/evidence/${item.id}/`));
    }
    assert.ok(html.includes(content[locale].benchmarks.note));
    assert.ok(html.includes(`href="${BUY_PRO}"`));
    assert.ok(html.includes(`href="${BUY_TEAM}"`));
  }
});

test('all generated pages resolve original-color PNG logo and favicon files', async () => {
  async function htmlFiles(folder) {
    const entries = await readdir(folder, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => entry.isDirectory() ? htmlFiles(`${folder}/${entry.name}`) : entry.name.endsWith('.html') ? [`${folder}/${entry.name}`] : []))).flat();
  }
  const files = await htmlFiles(`${root}/dist`);
  assert.equal(files.length, 8 + 2 * (1 + cases.length));
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    for (const asset of ['/brand/vettalon-mark.png', '/brand/company-mark.png', '/favicon.ico', '/favicon-32.png', '/favicon-48.png', '/apple-touch-icon.png']) {
      assert.ok(html.includes(asset), `${file} must reference ${asset}`);
      assert.ok((await readFile(`${root}/dist${asset}`)).length);
    }
    assert.doesNotMatch(html, /mark-dark|mark-mono|favicon-dark|favicon\.svg/);
  }
});
