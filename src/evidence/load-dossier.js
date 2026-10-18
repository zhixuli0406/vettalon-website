import { validateManifest, validateDossier } from './schema.js';

const maxBytes = 64 * 1024;
const failure = () => new Error('Public evidence preview could not be verified.');

/** User-triggered, same-origin byte verification. Never returns unverified content. */
export async function loadDossier(item, { signal, fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto, timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  let reader;
  let rejectAbort;
  const duration = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(5000, timeoutMs)) : 5000;
  const deadline = performance.now() + duration;
  const ensureActive = () => { if (controller.signal.aborted || performance.now() >= deadline) throw failure(); };
  const cancelReader = () => { if (reader) void reader.cancel().catch(() => {}); };
  const abort = () => controller.abort();
  const onAbort = () => { cancelReader(); rejectAbort(failure()); };
  const aborted = new Promise((_, reject) => { rejectAbort = reject; });
  controller.signal.addEventListener('abort', onAbort, { once: true });
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, duration);
  const operation = async () => {
    ensureActive();
    validateManifest([item]);
    if (!item.dossier || item.dossier.artifactPath !== `/evidence/dossiers/${item.id}.json`) throw failure();
    const response = await fetchImpl(item.dossier.artifactPath, { method: 'GET', mode: 'same-origin', credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal });
    if (controller.signal.aborted || performance.now() >= deadline) {
      if (response.body) void response.body.cancel().catch(() => {});
      throw failure();
    }
    if (!response.ok || !response.body || typeof response.body.getReader !== 'function') {
      if (response.body) void response.body.cancel().catch(() => {});
      throw failure();
    }
    reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      ensureActive();
      if (done) break;
      if (!(value instanceof Uint8Array) || (length += value.byteLength) > maxBytes) throw failure();
      if (value.byteLength) chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
    ensureActive();
    const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (actual !== item.dossier.sha256) throw failure();
    const dossier = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    validateDossier(item, dossier);
    ensureActive();
    return dossier;
  };
  try { return await Promise.race([operation(), aborted]); }
  catch { controller.abort(); throw failure(); }
  finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', onAbort);
    try { reader?.releaseLock(); } catch { /* Pending reads are cancelled, never exposed. */ }
  }
}

/** A request identity guard also rejects loaders that ignore AbortSignal. */
export function createDossierSession(notify, loader = loadDossier) {
  let sequence = 0;
  let disposed = false;
  let controller;
  return {
    async load(item) {
      if (disposed) return;
      const request = ++sequence;
      controller?.abort();
      const current = new AbortController(); controller = current;
      const identity = { caseId: item.id, digest: item.dossier.sha256, request };
      notify({ ...identity, phase: 'loading' });
      try {
        const dossier = await loader(item, { signal: current.signal });
        if (!disposed && request === sequence && !current.signal.aborted) notify({ ...identity, phase: 'verified', dossier });
      } catch {
        if (!disposed && request === sequence && !current.signal.aborted) notify({ ...identity, phase: 'error' });
      }
    },
    dispose() { disposed = true; sequence++; controller?.abort(); },
  };
}

/** Hide a previous case or digest synchronously, before effect cleanup runs. */
export function previewStateFor(state, item) {
  return state.caseId === item.id && state.digest === item.dossier.sha256 ? state : { phase: 'idle' };
}
