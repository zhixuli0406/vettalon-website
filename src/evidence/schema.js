/**
 * @typedef {{zh: string, en: string}} Localized
 * @typedef {Object} PublicCase
 * @property {string} id
 * @property {'public'} publication
 * @property {string} reviewedAt
 * @property {'historical'|'discovery'|'reported'} type
 * @property {'source-reviewed'|'detected'|'reproduced'|'regression-verified'} status
 * @property {string} package
 * @property {'PyPI'|'npm'|'Packagist'|'Cargo'|'Go'|'RubyGems'} ecosystem
 * @property {Localized} title
 * @property {Localized} summary
 * @property {string|null} cve
 * @property {string} ghsa
 * @property {string|null} cwe
 * @property {string} sourceVersion
 * @property {string} fixedVersion
 * @property {string} sourceUrl
 * @property {string} advisoryUrl
 * @property {string} fixUrl
 * @property {string} publishedAt
 * @property {Localized} boundary
 * @property {Localized} method
 * @property {Localized} limitations
 * @property {Localized} credit
 * @property {Array<{date: string, event: Localized}>} timeline
 * @property {{mode: string, findingStatus: string, file: string, line: number, observedAt: string, sha256: string, claim: Localized, reviewerConclusion: Localized, finder: string, reviewer: string, toolVersion: string, modelVersions: string, scope: string, rerun: string}} [detection]
 * @property {{mode: 'differential', artifactUrl: string, sha256: string, vulnerable: 'pass', fixed: 'pass', control: 'pass'}} [reproduction]
 * @property {string} [upstreamCreditUrl]
 * @property {{artifactPath: string, sha256: string, runStatus: 'complete'|'incomplete', incompleteReason: string|null}} [dossier]
 * @property {string} [rustsecId]
 * @property {{artifactPath: string, sha256: string, testedAt: string, checks: Array<{id: string, role: string, vulnerable: string, fixed: string}>}} [regression]
 * @property {{artifactPath: string, sha256: string, testedAt: string}} [pairedBundle]
 * @property {{artifactPath: string, sha256: string, observedAt: string, findingStatus: 'needs_human'}} [origin]
 * @property {{reviewer: string, reviewedAt: string, aiUse: Localized}} [review]
 * @property {{reportedAt: string, acknowledgement: {at: string|null, url: string}|null, fixedReleaseAt: string|null}} [disclosure]
 */
// Per-case expectations for curated public artifacts, keyed by case id.
// A reported/discovery case with a regression summary or product-origin excerpt
// must have an entry here; unknown ids are rejected (fail closed).
const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};

const ammoniaChecks = [
  ['http_lower', 'denied-policy', 'ok'], ['http_upper', 'denied-policy', 'failed'],
  ['https_control', 'allowed-control', 'ok'], ['relative_lower', 'denied-policy', 'ok'],
  ['relative_mixed', 'denied-policy', 'failed'],
].map(([id, role, vulnerable]) => ({ id, role, vulnerable, testName: `policy_css_url_${id}${id === 'https_control' ? '' : '_denied'}` }));

/** @type {Readonly<Record<string, {regression?: object, origin?: object, pairedBundle?: object}>>} */
export const caseProfiles = deepFreeze({
  'ammonia-ghsa-x43w-36pp-96g3': {
    regression: {
      checks: ammoniaChecks,
      scope: { kind: 'isolated-library-policy-tests', testCount: 5, inputCount: 7 },
      arms: {
        vulnerable: { exitCode: 101, passed: 3, failed: 2, filtered: 108, summaryPrefix: 'test result: FAILED. 3 passed; 2 failed;' },
        fixed: { exitCode: 0, passed: 5, failed: 0, filtered: 109, summaryPrefix: 'test result: ok. 5 passed; 0 failed;' },
      },
    },
    origin: {
      archivedToolOutputLineSha256: '2ffcb9b4dc279bcd1303990de185022dbdcce85661cca3229c1934b10e4fbb5e',
      version: '4.1.7', severityCandidate: 'medium', location: 'ammonia-4.1.7/src/style.rs:170',
      title: 'Case-sensitive url() match lets quoted URL()/Url() bypass style URL scheme and relative-URL filtering',
      draftFilename: 'ammonia_4_1_7-ai_audit_8c00985855923e82.md',
    },
    pairedBundle: { artifactPath: '/evidence/bundles/ammonia-paired-20261019.zip', kind: 'regression' },
  },
  'aiohttp-cve-2024-23334': {
    pairedBundle: { artifactPath: '/evidence/bundles/aiohttp-paired-20261019.zip', kind: 'historical-http', testedAt: '2026-10-18' },
  },
});

const required = ['id','publication','reviewedAt','type','status','package','ecosystem','title','summary','cve','ghsa','cwe','sourceVersion','fixedVersion','sourceUrl','advisoryUrl','fixUrl','publishedAt','boundary','method','limitations','credit','timeline'];
const optional = ['detection','reproduction','upstreamCreditUrl','dossier','rustsecId','regression','origin','pairedBundle','review','disclosure'];
const ecosystems = ['PyPI','npm','Packagist','Cargo','Go','RubyGems'];
// Public reviewer handle: GitHub-style pseudonym only, never an email or a free-text name.
const reviewerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
function ensure(ok) { if (!ok) throw new Error('Public evidence manifest rejected; review the publication schema.'); }
function exactKeys(value, keys) { ensure(value && typeof value === 'object' && !Array.isArray(value)); ensure(Object.keys(value).every(k => keys.includes(k)) && keys.every(k => Object.hasOwn(value, k))); }
function text(value) { ensure(typeof value === 'string' && value.trim().length > 0 && value.length < 4000); ensure(!/\/Users\/|\/home\/|file:\/\/|localhost|127\.0\.0\.1|vettalon-pro|<script|\b[a-z]:[\\/]|\\\\[^\\\s]+\\/i.test(value)); }
function digest(value) { ensure(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)); }
function date(value) {
  ensure(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));
  const parsed = new Date(value + 'T00:00:00.000Z');
  ensure(!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value);
}
function localized(value) { exactKeys(value, ['zh','en']); text(value.zh); text(value.en); }
// Look up a case profile by own key only, so ids such as "constructor" never resolve to prototype members.
function profileFor(profiles, id, section) {
  ensure(profiles && typeof profiles === 'object');
  const profile = Object.hasOwn(profiles, id) ? profiles[id] : undefined;
  const value = profile && Object.hasOwn(profile, section) ? profile[section] : undefined;
  ensure(Boolean(value)); return value;
}
function optionalTimelineDate(value, dates) { if (value === null) return; date(value); ensure(dates.has(value)); }
function publicUrl(value) {
  text(value); let url; try { url = new URL(value); } catch { ensure(false); }
  ensure(url.protocol === 'https:' && !url.username && !url.password && !url.search);
  ensure(['github.com','nvd.nist.gov','osv.dev','rustsec.org','vettalon.dudustudio.monster'].includes(url.hostname));
  if (url.hostname === 'github.com') ensure(/^\/(?:advisories\/GHSA-[a-z0-9-]+|[^/]+\/[^/]+\/(?:security\/advisories\/GHSA-[a-z0-9-]+|commit\/[a-f0-9]{7,40}|blob\/[^/]+\/.+|pull\/\d+(?:\/files)?))$/.test(url.pathname));
  if (url.hostname === 'rustsec.org') ensure(/^\/advisories\/RUSTSEC-\d{4}-\d{4}\.html$/.test(url.pathname));
}
/**
 * Validate an explicitly curated public-only input. Never accepts or silently filters private records.
 * `profiles` defaults to the built-in per-case expectations; tests may pass fixture profiles.
 * @returns {PublicCase[]}
 */
export function validateManifest(input, { profiles = caseProfiles } = {}) {
  ensure(Array.isArray(input)); const ids = new Set();
  for (const item of input) {
    ensure(item && typeof item === 'object');
    ensure(Object.keys(item).every(k => [...required,...optional].includes(k)) && required.every(k => Object.hasOwn(item,k)));
    ensure(item.publication === 'public' && ['historical','discovery','reported'].includes(item.type) && ['source-reviewed','detected','reproduced','regression-verified'].includes(item.status));
    ensure(typeof item.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) && !ids.has(item.id)); ids.add(item.id);
    for (const key of ['title','summary','boundary','method','limitations','credit']) localized(item[key]);
    for (const key of ['package','sourceVersion','fixedVersion']) text(item[key]);
    ensure(ecosystems.includes(item.ecosystem));
    ensure(item.cve === null ? ['reported','discovery'].includes(item.type) && Boolean(item.rustsecId) : typeof item.cve === 'string' && /^CVE-\d{4}-\d{4,}$/.test(item.cve));
    ensure(typeof item.ghsa === 'string' && /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(item.ghsa));
    ensure(item.cwe === null ? ['reported','discovery'].includes(item.type) && Boolean(item.rustsecId) : typeof item.cwe === 'string' && /^CWE-\d+$/.test(item.cwe));
    for (const key of ['sourceUrl','advisoryUrl','fixUrl']) publicUrl(item[key]);
    date(item.reviewedAt); date(item.publishedAt); ensure(item.reviewedAt >= item.publishedAt);
    ensure(Array.isArray(item.timeline) && item.timeline.length > 0);
    let previousDate = ''; const events = new Set();
    for (const entry of item.timeline) {
      exactKeys(entry,['date','event']); date(entry.date); localized(entry.event);
      ensure(entry.date <= item.reviewedAt && entry.date >= previousDate);
      const eventKey = JSON.stringify([entry.date,entry.event.zh,entry.event.en]);
      ensure(!events.has(eventKey)); events.add(eventKey); previousDate = entry.date;
    }
    const timelineDates = new Set(item.timeline.map(entry => entry.date));
    if (item.review !== undefined) {
      exactKeys(item.review, ['reviewer','reviewedAt','aiUse']);
      ensure(typeof item.review.reviewer === 'string' && reviewerPattern.test(item.review.reviewer));
      // The public review date is the case review date; it cannot be set independently.
      date(item.review.reviewedAt); ensure(item.review.reviewedAt === item.reviewedAt);
      localized(item.review.aiUse);
    }
    if (item.type === 'reported') ensure(item.disclosure !== undefined);
    if (item.disclosure !== undefined) {
      // Funnel stage dates may only restate dates already recorded on the case timeline.
      ensure(['reported','discovery'].includes(item.type));
      exactKeys(item.disclosure, ['reportedAt','acknowledgement','fixedReleaseAt']);
      date(item.disclosure.reportedAt); ensure(timelineDates.has(item.disclosure.reportedAt) && item.disclosure.reportedAt <= item.publishedAt);
      if (item.disclosure.acknowledgement !== null) {
        exactKeys(item.disclosure.acknowledgement, ['at','url']);
        optionalTimelineDate(item.disclosure.acknowledgement.at, timelineDates);
        ensure(item.disclosure.acknowledgement.at === null || item.disclosure.acknowledgement.at >= item.disclosure.reportedAt);
        publicUrl(item.disclosure.acknowledgement.url);
      }
      optionalTimelineDate(item.disclosure.fixedReleaseAt, timelineDates);
      ensure(item.disclosure.fixedReleaseAt === null || item.disclosure.fixedReleaseAt >= item.disclosure.reportedAt);
    }
    if (item.upstreamCreditUrl) publicUrl(item.upstreamCreditUrl);
    if (item.status === 'regression-verified') ensure(Boolean(item.regression));
    if (item.type === 'discovery') {
      publicUrl(item.upstreamCreditUrl);
      ensure(item.status === 'reproduced' || (item.status === 'regression-verified' && Boolean(item.origin)));
    }
    if (item.origin) {
      ensure(item.type === 'discovery' && item.status === 'regression-verified');
      exactKeys(item.origin, ['artifactPath','sha256','observedAt','findingStatus']);
      ensure(item.origin.artifactPath === `/evidence/origins/${item.id}.json`);
      digest(item.origin.sha256); date(item.origin.observedAt);
      ensure(item.origin.observedAt <= item.publishedAt && item.origin.findingStatus === 'needs_human');
    }
    if (item.regression) {
      ensure(['reported','discovery'].includes(item.type) && item.status === 'regression-verified' && !item.detection && !item.reproduction && !item.dossier);
      ensure(typeof item.rustsecId === 'string' && /^RUSTSEC-\d{4}-\d{4}$/.test(item.rustsecId));
      ensure(item.upstreamCreditUrl === `https://rustsec.org/advisories/${item.rustsecId}.html`);
      ensure(typeof item.regression === 'object');
      exactKeys(item.regression, ['artifactPath','sha256','testedAt','checks']);
      ensure(item.regression.artifactPath === `/evidence/regressions/${item.id}.json`);
      digest(item.regression.sha256); date(item.regression.testedAt);
      ensure(item.regression.testedAt <= item.reviewedAt && item.regression.testedAt >= item.publishedAt);
      const expected = profileFor(profiles, item.id, 'regression').checks;
      ensure(Array.isArray(item.regression.checks) && item.regression.checks.length === expected.length);
      for (let index = 0; index < expected.length; index++) {
        const check = item.regression.checks[index]; const { id, role, vulnerable } = expected[index];
        exactKeys(check, ['id','role','vulnerable','fixed']);
        ensure(check.id === id && check.role === role && check.vulnerable === vulnerable && check.fixed === 'ok');
      }
    } else ensure(!item.rustsecId && item.type !== 'reported');
    if (item.pairedBundle) {
      const bundle = profileFor(profiles, item.id, 'pairedBundle');
      exactKeys(item.pairedBundle, ['artifactPath','sha256','testedAt']);
      ensure(item.pairedBundle.artifactPath === bundle.artifactPath);
      digest(item.pairedBundle.sha256); date(item.pairedBundle.testedAt);
      ensure(item.pairedBundle.testedAt <= item.reviewedAt);
      if (bundle.kind === 'regression') ensure(Boolean(item.regression) && item.pairedBundle.testedAt >= item.regression.testedAt);
      else if (bundle.kind === 'historical-http') ensure(item.pairedBundle.testedAt === bundle.testedAt && item.type === 'historical' && item.status === 'detected' && Boolean(item.detection) && Boolean(item.dossier) && !item.regression && !item.reproduction);
      else ensure(false);
    }
    if (item.detection) {
      exactKeys(item.detection,['mode','findingStatus','file','line','observedAt','sha256','claim','reviewerConclusion','finder','reviewer','toolVersion','modelVersions','scope','rerun']);
      ensure(item.detection.mode === 'focused' && ['candidate','needs_human','refuted'].includes(item.detection.findingStatus));
      localized(item.detection.claim); localized(item.detection.reviewerConclusion);
      for (const key of ['finder','reviewer','toolVersion','modelVersions','scope','rerun']) text(item.detection[key]);
      text(item.detection.file); ensure(!item.detection.file.startsWith('/') && !/[\\:]/.test(item.detection.file) && item.detection.file.split('/').every(part => part && part !== '.' && part !== '..'));
      ensure(Number.isInteger(item.detection.line) && item.detection.line > 0); date(item.detection.observedAt); ensure(item.detection.observedAt <= item.reviewedAt); digest(item.detection.sha256);
    }
    if (item.dossier) {
      ensure(Boolean(item.detection));
      exactKeys(item.dossier,['artifactPath','sha256','runStatus','incompleteReason']);
      ensure(item.dossier.artifactPath === `/evidence/dossiers/${item.id}.json`);
      digest(item.dossier.sha256);
      validateRunStatus(item.dossier);
    }
    if (item.status === 'detected') ensure(Boolean(item.detection));
    if (item.reproduction) {
      exactKeys(item.reproduction,['mode','artifactUrl','sha256','vulnerable','fixed','control']);
      ensure(item.reproduction.mode === 'differential' && item.reproduction.vulnerable === 'pass' && item.reproduction.fixed === 'pass' && item.reproduction.control === 'pass');
      publicUrl(item.reproduction.artifactUrl); digest(item.reproduction.sha256);
    }
    if (item.status === 'reproduced') ensure(Boolean(item.reproduction));
  }
  return input;
}
function validateRunStatus(value) {
  ensure(['complete','incomplete'].includes(value.runStatus));
  ensure(value.runStatus === 'complete' ? value.incompleteReason === null : ['units_failed','time_budget_exhausted','scope_not_fully_reviewed'].includes(value.incompleteReason));
}
/** Validate a curated historical excerpt, not the identity or truth of its original report. */
export function validateDossier(item, dossier) {
  ensure(Boolean(item.detection && item.dossier));
  exactKeys(dossier,['schemaVersion','caseId','originalReport','scan','finding','review','publicSource','limitations']);
  ensure(dossier.schemaVersion === 1 && dossier.caseId === item.id);
  exactKeys(dossier.originalReport,['sha256','schemaVersion']);
  ensure(dossier.originalReport.schemaVersion === 2 && dossier.originalReport.sha256 === item.detection.sha256);
  exactKeys(dossier.scan,['runStatus','incompleteReason']); validateRunStatus(dossier.scan);
  ensure(dossier.scan.runStatus === item.dossier.runStatus && dossier.scan.incompleteReason === item.dossier.incompleteReason);
  exactKeys(dossier.finding,['file','line','status','title','snippet','reportedFileSha256']);
  for (const key of ['file','line']) ensure(dossier.finding[key] === item.detection[key]);
  ensure(dossier.finding.status === item.detection.findingStatus);
  text(dossier.finding.title); text(dossier.finding.snippet);
  ensure(typeof dossier.finding.reportedFileSha256 === 'string' && /^[a-f0-9]{64}$/.test(dossier.finding.reportedFileSha256));
  exactKeys(dossier.review,['model','family','verdict','detail','omissionReason']);
  text(dossier.review.model); text(dossier.review.family);
  ensure(['plausible','no_verdict'].includes(dossier.review.verdict));
  if (dossier.review.verdict === 'no_verdict') {
    ensure(dossier.review.detail === null && dossier.review.omissionReason === 'runtime_error_trace_excluded');
  } else {
    text(dossier.review.detail); ensure(dossier.review.omissionReason === null);
  }
  exactKeys(dossier.publicSource,['url','commit','sourceBytesVerified']);
  publicUrl(dossier.publicSource.url);
  ensure(dossier.publicSource.url === `${item.sourceUrl}#L${item.detection.line}`);
  // A tag reference and a report-recorded file digest are not historical source verification.
  ensure(dossier.publicSource.commit === null && dossier.publicSource.sourceBytesVerified === false);
  localized(dossier.limitations);
  return dossier;
}
/** Validate a redacted archived product-output excerpt, not the full historical hunt report. */
export function validateOrigin(item, artifact, { profiles = caseProfiles } = {}) {
  ensure(item.type === 'discovery' && Boolean(item.origin));
  const expected = profileFor(profiles, item.id, 'origin');
  exactKeys(artifact, ['schemaVersion','caseId','observedAt','recordKind','archivedToolOutputLineSha256','finding','draft','limits']);
  ensure(artifact.schemaVersion === 1 && artifact.caseId === item.id && artifact.observedAt === item.origin.observedAt);
  ensure(artifact.recordKind === 'curated-archived-vettalon-hunt-output');
  ensure(artifact.archivedToolOutputLineSha256 === expected.archivedToolOutputLineSha256);
  exactKeys(artifact.finding, ['dependency','version','status','severityCandidate','location','title']);
  ensure(artifact.finding.dependency === item.package && artifact.finding.version === expected.version);
  ensure(artifact.finding.status === item.origin.findingStatus && artifact.finding.severityCandidate === expected.severityCandidate);
  ensure(artifact.finding.location === expected.location);
  ensure(artifact.finding.title === expected.title);
  exactKeys(artifact.draft, ['generatedByHunt','automaticallySubmitted','filename']);
  ensure(artifact.draft.generatedByHunt === true && artifact.draft.automaticallySubmitted === false);
  ensure(artifact.draft.filename === expected.draftFilename);
  exactKeys(artifact.limits, ['fullHuntReportRecovered','originalSourceBytesRecovered','sentMessageReceiptPublic','otherCandidatesExcluded']);
  ensure(artifact.limits.fullHuntReportRecovered === false && artifact.limits.originalSourceBytesRecovered === false);
  ensure(artifact.limits.sentMessageReceiptPublic === false && artifact.limits.otherCandidatesExcluded === true);
  return artifact;
}
/** Validate a curated local regression summary; original execution logs remain private. */
export function validateRegression(item, artifact, { profiles = caseProfiles } = {}) {
  ensure(['reported','discovery'].includes(item.type) && item.status === 'regression-verified' && Boolean(item.regression));
  const expected = profileFor(profiles, item.id, 'regression'); const checks = expected.checks;
  exactKeys(artifact, ['schemaVersion','caseId','testedAt','scope','arms','checks','limitations']);
  ensure(artifact.schemaVersion === 1 && artifact.caseId === item.id && artifact.testedAt === item.regression.testedAt);
  exactKeys(artifact.scope, ['kind','testCount','inputCount','officialFixedCrate','originalLogsPublic','productScannerUsed']);
  ensure(artifact.scope.kind === expected.scope.kind && artifact.scope.testCount === expected.scope.testCount && artifact.scope.inputCount === expected.scope.inputCount);
  ensure(expected.scope.testCount === checks.length);
  ensure(artifact.scope.officialFixedCrate === true && artifact.scope.originalLogsPublic === false && artifact.scope.productScannerUsed === false);
  exactKeys(artifact.arms, ['vulnerable','fixed']);
  for (const [name, arm] of Object.entries(artifact.arms)) {
    exactKeys(arm, ['version','testExcerpt','exitCode','passed','failed','filtered']);
    ensure(arm.version === (name === 'vulnerable' ? item.sourceVersion : item.fixedVersion));
    ensure(Array.isArray(arm.testExcerpt) && arm.testExcerpt.length === checks.length + 1);
    for (const [index, check] of checks.entries()) {
      const result = name === 'vulnerable' ? check.vulnerable : 'ok';
      ensure(arm.testExcerpt[index] === `test test::${check.testName} ... ${result === 'ok' ? 'ok' : 'FAILED'}`);
    }
    ensure(arm.testExcerpt[checks.length].startsWith(expected.arms[name].summaryPrefix));
    ensure(Number.isInteger(arm.filtered) && arm.filtered >= 0);
  }
  for (const name of ['vulnerable','fixed']) {
    const arm = artifact.arms[name]; const want = expected.arms[name];
    ensure(arm.exitCode === want.exitCode && arm.passed === want.passed && arm.failed === want.failed && arm.filtered === want.filtered);
  }
  ensure(Array.isArray(artifact.checks) && artifact.checks.length === checks.length);
  for (let index = 0; index < checks.length; index++) {
    const check = artifact.checks[index]; const { id: name, role, vulnerable, testName } = checks[index];
    exactKeys(check, ['id','testName','role','vulnerable','fixed']);
    ensure(check.id === name && check.testName === testName);
    ensure(check.role === role && check.vulnerable === vulnerable && check.fixed === 'ok');
    ensure(item.regression.checks[index].id === check.id && item.regression.checks[index].role === check.role && item.regression.checks[index].vulnerable === check.vulnerable && item.regression.checks[index].fixed === check.fixed);
  }
  localized(artifact.limitations);
  return artifact;
}
export function readFilters(query = '') {
  const params = new URLSearchParams(query);
  const facet = (key, values) => values.includes(params.get(key)) ? params.get(key) : '';
  return { q: (params.get('q') || '').slice(0,200), type: facet('type',['historical','discovery','reported']), status: facet('status',['source-reviewed','detected','reproduced','regression-verified']), ecosystem: facet('ecosystem',ecosystems), sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest' };
}
export function filterQuery(filters) {
  const params = new URLSearchParams();
  for (const key of ['q','type','status','ecosystem','sort']) if (filters[key] && !(key === 'sort' && filters[key] === 'newest')) params.set(key,filters[key]);
  return params.size ? '?' + params.toString() : '';
}
export function selectCases(cases, filters = {}) {
  const q = (filters.q || '').trim().toLocaleLowerCase();
  return cases.filter(c => (!filters.type || c.type === filters.type) && (!filters.status || c.status === filters.status) && (!filters.ecosystem || c.ecosystem === filters.ecosystem) && (!q || [c.package,c.cve,c.ghsa,c.cwe,c.rustsecId,c.title.zh,c.title.en].some(v => v?.toLocaleLowerCase().includes(q))))
    .sort((a,b) => (filters.sort === 'oldest' ? a.publishedAt.localeCompare(b.publishedAt) : b.publishedAt.localeCompare(a.publishedAt)) || a.id.localeCompare(b.id));
}
