import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { cases } from '../src/evidence/cases.js';
import { loadDossier, createDossierSession } from '../src/evidence/load-dossier.js';

const item = cases[0];
const bytes = new Uint8Array(await readFile('public' + item.dossier.artifactPath));
const expected = JSON.parse(new TextDecoder().decode(bytes));
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const digest = async data => Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256', data)), b => b.toString(16).padStart(2,'0')).join('');
const options = fetchImpl => ({ fetchImpl, cryptoImpl: webcrypto });
const settleWithin = async promise => Promise.race([promise.then(() => 'accepted', () => 'rejected'), new Promise(resolve => setTimeout(() => resolve('unbounded'), 100))]);

test('verified bytes are loaded only from the exact case path with restrictive fetch options', async () => {
  let called = 0;
  const loaded = await loadDossier(item, options(async (path, init) => {
    called++; assert.equal(path, item.dossier.artifactPath);
    assert.equal(init.credentials,'omit'); assert.equal(init.cache,'no-store'); assert.equal(init.mode,'same-origin'); assert.equal(init.redirect,'error');
    assert.ok(init.signal); return new Response(bytes);
  }));
  assert.equal(called,1); assert.deepEqual(loaded,expected);
});

const invalidUtf8 = bytes.slice();
invalidUtf8[new TextDecoder().decode(bytes).indexOf('"title": "') + '"title": "'.length] = 0xff;
const schemaMismatch = new TextEncoder().encode(JSON.stringify({ ...expected, caseId:'other-case', privateTrace:'PRIVATE_PREVIEW_SENTINEL' }));
for (const [name,data,hash] of [['wrong SHA',bytes,'a'.repeat(64)],['invalid UTF-8',invalidUtf8,await digest(invalidUtf8)],['schema mismatch',schemaMismatch,await digest(schemaMismatch)]]) {
  test(name+' never returns unverified payload', async () => {
    const changed=structuredClone(item); changed.dossier.sha256=hash;
    await assert.rejects(()=>loadDossier(changed,options(async()=>new Response(data))),error=>!error.message.includes('PRIVATE_PREVIEW_SENTINEL'));
  });
}

test('HTTP failures, missing stream, bad descriptor and pre-aborted signal fail before returning payload', async () => {
  await assert.rejects(() => loadDossier(item,options(async () => new Response(bytes,{status:500}))));
  await assert.rejects(() => loadDossier(item,options(async () => new Response(null))));
  let calls = 0; const fetchImpl = async () => { calls++; return new Response(bytes); };
  const changed = structuredClone(item); changed.dossier.artifactPath='https://other.example/private.json';
  await assert.rejects(() => loadDossier(changed,options(fetchImpl)));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => loadDossier(item,{...options(fetchImpl),signal:controller.signal}));
  assert.equal(calls,0);
});

test('actual streaming byte cap cancels reader and does not fall back to whole-body helpers', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(65536)); controller.enqueue(new Uint8Array(1)); }, cancel() { cancelled=true; } });
  assert.equal(await settleWithin(loadDossier(item,options(async () => new Response(stream)))),'rejected');
  assert.equal(cancelled,true);
});

test('one deadline bounds ignored-abort fetch, stalled streaming and pending digest', async () => {
  for (const stage of ['fetch','stream','digest']) {
    let cancelled = false;
    const init = { ...options(async () => stage==='fetch' ? new Promise(() => {}) : stage==='stream' ? new Response(new ReadableStream({cancel(){cancelled=true;}})) : new Response(bytes)), timeoutMs:15 };
    if (stage==='digest') init.cryptoImpl={subtle:{digest:async()=>new Promise(()=>{})}};
    assert.equal(await settleWithin(loadDossier(item,init)),'rejected',stage+' must have a total deadline');
    if(stage==='stream') assert.equal(cancelled,true);
  }
});

test('late crypto completion after external abort is rejected', async () => {
  const pending=deferred(); const entered=deferred(); const controller=new AbortController();
  const result=loadDossier(item,{...options(async()=>new Response(bytes)),signal:controller.signal,cryptoImpl:{subtle:{digest:async()=>{entered.resolve();return pending.promise;}}}});
  const rejected = assert.rejects(()=>result);
  await entered.promise; controller.abort(); pending.resolve(await webcrypto.subtle.digest('SHA-256',bytes));
  await rejected;
});

test('case switch, overlapping requests and disposal cannot publish stale or late results', async () => {
  const updates=[]; const requests=[];
  const session=createDossierSession(state=>updates.push(state),async (caseItem,{signal})=>{const value=deferred();requests.push({value,signal,caseId:caseItem.id});return value.promise;});
  const first=session.load(item); const other=cases[1]; const second=session.load(other);
  assert.equal(requests[0].signal.aborted,true);
  requests[1].value.resolve({caseId:other.id}); await second;
  requests[0].value.resolve({caseId:item.id}); await first;
  assert.equal(updates.at(-1).caseId,other.id); assert.equal(updates.at(-1).phase,'verified');
  const third=session.load(item); session.dispose(); const count=updates.length;
  assert.equal(requests[2].signal.aborted,true); requests[2].value.resolve({caseId:item.id}); await third;
  assert.equal(updates.length,count);
});

test('render identity guard synchronously hides old-case or old-digest payload before effects run', async () => {
  const { previewStateFor } = await import('../src/evidence/load-dossier.js');
  const state={phase:'verified',caseId:item.id,digest:item.dossier.sha256,request:1,dossier:expected};
  assert.equal(previewStateFor(state,item),state);
  assert.equal(previewStateFor(state,cases[1]).phase,'idle');
  const changed=structuredClone(item);changed.dossier.sha256='a'.repeat(64);
  assert.equal(previewStateFor(state,changed).phase,'idle');
});

test('late fetch bodies are cancelled and a hanging cancel does not extend the deadline', async () => {
  const pending=deferred();let cancelled=false;
  const result=loadDossier(item,{...options(()=>pending.promise),timeoutMs:15});
  assert.equal(await settleWithin(result),'rejected');
  pending.resolve(new Response(new ReadableStream({cancel(){cancelled=true;}})));
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(cancelled,true);
  const stream=new ReadableStream({cancel(){return new Promise(()=>{});}});
  assert.equal(await settleWithin(loadDossier(item,{...options(async()=>new Response(stream)),timeoutMs:15})),'rejected');
});
