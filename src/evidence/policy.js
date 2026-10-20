// Evidence-wall policy sentence. Counts are derived from the public manifest
// so the copy cannot drift from the case list.
const zhNumber = n => ['零','一','兩','三','四','五','六','七','八','九','十'][n] ?? String(n);
const enNumber = n => ['zero','one','two','three','four','five','six','seven','eight','nine','ten'][n] ?? String(n);

export function policyText(locale, manifest) {
  const count = type => manifest.filter(item => item.type === type).length;
  const [historical, discovery, reported] = ['historical','discovery','reported'].map(count);
  const ammonia = manifest.some(item => item.id === 'ammonia-ghsa-x43w-36pp-96g3');
  if (locale === 'zh') {
    const parts = [`${zhNumber(historical)}筆歷史聚焦識別測試`, `${zhNumber(discovery)}筆 Vettalon 原創發現`, ...(reported ? [`${zhNumber(reported)}筆上游通報`] : [])];
    return `${parts.slice(0, -1).join('、')}與${parts.at(-1)}分開列示。${ammonia ? 'Ammonia 保留產品候選及擬稿、人工送件、上游修補與限定回歸的證據邊界；' : ''}未公開候選不在此列。`;
  }
  const plural = (n, one, many) => `${enNumber(n)} ${n === 1 ? one : many}`;
  const parts = [plural(historical, 'historical focused detection', 'historical focused detections'), plural(discovery, 'original Vettalon discovery', 'original Vettalon discoveries'), ...(reported ? [plural(reported, 'upstream report', 'upstream reports')] : [])];
  const list = parts.length > 2 ? `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}` : parts.join(' and ');
  return `${list[0].toUpperCase()}${list.slice(1)} are labeled separately.${ammonia ? ' Ammonia traces the product candidate and draft, human submission, upstream fix, and scoped regression.' : ''} Unpublished candidates are excluded.`;
}
