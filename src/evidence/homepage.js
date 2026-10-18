// Keep the homepage collection tied to the curated, public manifest.
export function homepageEvidence(manifest, copy) {
  const published = manifest.filter((item) => item.publication === 'public');
  const byId = new Map(published.map((item) => [item.id, item]));
  const copyIds = new Set(copy.map((item) => item.id));
  if (copyIds.size !== copy.length || copyIds.size !== published.length) {
    throw new Error('Homepage evidence copy must match the public case manifest');
  }

  const counts = { public: published.length, historical: 0, discovery: 0, reported: 0 };
  const items = copy.map((label) => {
    const item = byId.get(label.id);
    if (!item) {
      throw new Error(`Homepage evidence case is incomplete: ${label.id}`);
    }
    const reference = item.type === 'historical' ? (item.cve || item.ghsa) : (item.ghsa || item.cve);
    if (!reference || !(item.type in counts)) {
      throw new Error(`Homepage evidence case is incomplete: ${item.id}`);
    }
    counts[item.type] += 1;
    return { ...label, id: item.id, v: reference, type: item.type };
  });
  return { counts, items };
}
