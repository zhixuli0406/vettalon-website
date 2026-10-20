// Disclosure funnel derived only from curated public case fields.
// No stage value is inferred from free text; missing data stays unknown.

export const FUNNEL_TYPES = ['discovery', 'reported', 'historical'];
export const FUNNEL_STAGES = ['reported', 'acknowledged', 'fixedRelease', 'advisory'];
// Below this sample size only counts are shown, never a rate.
export const MIN_N_FOR_RATE = 10;

/**
 * Stage states: 'reached' (public record exists), 'unknown' (no structured data),
 * 'not-applicable' (historical cases were not reported by Vettalon).
 * @returns {Record<string, {state: 'reached'|'unknown'|'not-applicable', date: string|null}>}
 */
export function caseStages(item) {
  const vettalonReport = item.type !== 'historical';
  const disclosure = vettalonReport ? item.disclosure : undefined;
  const acknowledgement = disclosure?.acknowledgement;
  return {
    reported: !vettalonReport ? notApplicable() : disclosure ? reached(disclosure.reportedAt) : unknown(),
    acknowledged: !vettalonReport ? notApplicable() : acknowledgement ? reached(acknowledgement.at) : unknown(),
    // fixedVersion and ghsa/publishedAt are required public fields on every case.
    fixedRelease: reached(disclosure?.fixedReleaseAt ?? null),
    advisory: reached(item.publishedAt),
  };
}
const reached = date => ({ state: 'reached', date: date ?? null });
const unknown = () => ({ state: 'unknown', date: null });
const notApplicable = () => ({ state: 'not-applicable', date: null });

/** Wilson score 95% interval; null below MIN_N_FOR_RATE so small samples never show a rate. */
export function wilsonInterval(successes, n, z = 1.959964) {
  if (!Number.isInteger(n) || !Number.isInteger(successes) || n < MIN_N_FOR_RATE || successes < 0 || successes > n) return null;
  const p = successes / n; const z2 = z * z;
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z / (1 + z2 / n)) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/** Aggregate per case type. `count` is null when no case in the type has data for the stage. */
export function funnelByType(cases) {
  return FUNNEL_TYPES.map(type => {
    const members = cases.filter(item => item.type === type);
    const perCase = members.map(item => ({ item, stages: caseStages(item) }));
    const stages = FUNNEL_STAGES.map(stage => {
      const states = perCase.map(({ item, stages: s }) => ({ item, ...s[stage] }));
      const hits = states.filter(entry => entry.state === 'reached');
      const known = states.filter(entry => entry.state !== 'unknown' && entry.state !== 'not-applicable').length;
      return {
        id: stage,
        count: known ? hits.length : null,
        unknown: states.filter(entry => entry.state === 'unknown').length,
        notApplicable: states.length > 0 && states.every(entry => entry.state === 'not-applicable'),
        entries: hits.map(({ item, date }) => ({ id: item.id, package: item.package, date }))
          .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.id.localeCompare(b.id)),
        interval: known ? wilsonInterval(hits.length, members.length) : null,
      };
    });
    return { type, n: members.length, reviewed: members.filter(item => item.review).length, stages };
  });
}
