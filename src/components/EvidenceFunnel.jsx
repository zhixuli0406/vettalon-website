import { funnelByType, MIN_N_FOR_RATE } from '../evidence/funnel.js';

const funnelLabels = {
  zh: {
    heading: '通報漏斗',
    intro: '依案例類型列出每個階段有公開紀錄的筆數與日期。數字只取自案例資料的結構化欄位，不從內文推算，也不補值。',
    types: { discovery: '原創發現', reported: '上游通報', historical: '歷史漏洞' },
    stages: { reported: '已通報上游', acknowledged: '維護者確認收到', fixedRelease: '修補版本釋出', advisory: '公告／CVE 公開' },
    basis: { reported: '人工送件，日期取自上游紀錄', acknowledged: '維護者公開回覆', fixedRelease: '上游修補版本', advisory: '上游 GHSA／CVE 公告' },
    n: n => `n = ${n}`,
    empty: '尚無公開案例',
    smallN: n => `只有 ${n} 筆，少於 ${MIN_N_FOR_RATE} 筆，只列筆數，不換算比例。`,
    interval: (lo, hi) => `Wilson 95% 區間 ${lo}–${hi}%`,
    count: (k, n) => `${k} / ${n}`,
    noDate: '日期未記錄',
    unknown: k => `另 ${k} 筆無資料`,
    notApplicable: '不適用',
    humanChecked: '人工核對',
    unreviewed: '含未審閱紀錄',
    reviewed: (r, n) => `${n} 筆中 ${r} 筆經人工審閱`,
    legend: '「—」表示沒有可公開的結構化資料，或該階段不適用；歷史案例不是 Vettalon 通報的，前兩個階段標為不適用。',
    human: '哪些階段經人工審閱：四個階段都只採用上游公開紀錄（通報日期、維護者回覆、修補版本、GHSA／CVE 公告），標「人工核對」的格子代表其中每筆案例都由人工審閱者對照來源核對過。Vettalon 的自動輸出（候選、needs_human）不算進漏斗，未經人工審閱的候選也不公開。',
  },
  en: {
    heading: 'Disclosure funnel',
    intro: 'For each case type, how many cases have a public record at each stage, with dates. Values come only from structured case fields; nothing is inferred from prose or filled in.',
    types: { discovery: 'Original discovery', reported: 'Upstream report', historical: 'Historical vulnerability' },
    stages: { reported: 'Reported upstream', acknowledged: 'Maintainer acknowledged', fixedRelease: 'Fixed release shipped', advisory: 'Advisory / CVE published' },
    basis: { reported: 'Human submission; date from the upstream record', acknowledged: 'Public maintainer reply', fixedRelease: 'Upstream fixed version', advisory: 'Upstream GHSA / CVE advisory' },
    n: n => `n = ${n}`,
    empty: 'No public cases yet',
    smallN: n => `Only ${n} ${n === 1 ? 'case' : 'cases'}, fewer than ${MIN_N_FOR_RATE}: counts only, no rates.`,
    interval: (lo, hi) => `Wilson 95% interval ${lo}–${hi}%`,
    count: (k, n) => `${k} / ${n}`,
    noDate: 'date not recorded',
    unknown: k => `${k} more without data`,
    notApplicable: 'Not applicable',
    humanChecked: 'Human-checked',
    unreviewed: 'Includes unreviewed records',
    reviewed: (r, n) => `${r} of ${n} human-reviewed`,
    legend: '“—” means no publishable structured data, or the stage does not apply. Historical cases were not reported by Vettalon, so the first two stages are not applicable.',
    human: 'Which stages are human-reviewed: all four stages use upstream public records only (report date, maintainer reply, fixed version, GHSA / CVE advisory). A cell marked “Human-checked” means every case in it was checked against its sources by the human reviewer. Automated Vettalon output (candidates, needs_human) is not counted, and candidates without human review are not published.',
  },
};

function StageCell({ stage, n, t, casesById }) {
  const allReviewed = stage.entries.length > 0 && stage.entries.every(entry => casesById.get(entry.id)?.review);
  return <li data-funnel={stage.count === null ? 'unknown' : 'counted'}>
    <h4>{t.stages[stage.id]}</h4>
    <p className="evidence__funnel-count mono">{stage.count === null ? '—' : t.count(stage.count, n)}</p>
    {stage.notApplicable ? <p className="evidence__funnel-note">{t.notApplicable}</p> : null}
    {stage.entries.length > 0 && <ul className="evidence__funnel-dates">{stage.entries.map(entry => <li key={entry.id}>{entry.package} · {entry.date ? <time dateTime={entry.date}>{entry.date}</time> : <span>—<span className="sr-only">{t.noDate}</span></span>}</li>)}</ul>}
    {stage.unknown > 0 && stage.count !== null && <p className="evidence__funnel-note">{t.unknown(stage.unknown)}</p>}
    {stage.interval && <p className="evidence__funnel-note">{t.interval(Math.round(stage.interval[0] * 100), Math.round(stage.interval[1] * 100))}</p>}
    {stage.entries.length > 0 && <p className="evidence__funnel-basis">{t.basis[stage.id]} · <span data-reviewed={allReviewed ? 'human' : 'partial'}>{allReviewed ? t.humanChecked : t.unreviewed}</span></p>}
  </li>;
}

export default function EvidenceFunnel({ cases, locale }) {
  const t = funnelLabels[locale];
  const casesById = new Map(cases.map(item => [item.id, item]));
  return <section className="evidence__funnel" aria-labelledby="evidence-funnel-heading">
    <div className="evidence__chain-head"><h2 id="evidence-funnel-heading">{t.heading}</h2><p>{t.intro}</p></div>
    {funnelByType(cases).map(group => <section className="evidence__funnel-type" key={group.type} aria-labelledby={`evidence-funnel-${group.type}`} data-type={group.type}>
      <h3 id={`evidence-funnel-${group.type}`}>{t.types[group.type]} <span className="mono">{t.n(group.n)}</span></h3>
      {group.n === 0 ? <p className="evidence__funnel-note">{t.empty}</p> : <>
        <p className="evidence__funnel-note">{t.reviewed(group.reviewed, group.n)}{group.n < MIN_N_FOR_RATE ? ` · ${t.smallN(group.n)}` : ''}</p>
        <ol className="evidence__funnel-stages">{group.stages.map(stage => <StageCell key={stage.id} stage={stage} n={group.n} t={t} casesById={casesById} />)}</ol>
      </>}
    </section>)}
    <p className="evidence__funnel-legend">{t.legend}</p>
    <p className="evidence__funnel-legend">{t.human}</p>
  </section>;
}
