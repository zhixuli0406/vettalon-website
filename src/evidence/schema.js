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
 */
const required = ['id','publication','reviewedAt','type','status','package','ecosystem','title','summary','cve','ghsa','cwe','sourceVersion','fixedVersion','sourceUrl','advisoryUrl','fixUrl','publishedAt','boundary','method','limitations','credit','timeline'];
const optional = ['detection','reproduction','upstreamCreditUrl','dossier','rustsecId','regression'];
const ecosystems = ['PyPI','npm','Packagist','Cargo','Go','RubyGems'];
const regressionChecks = [
  ['http_lower', 'denied-policy', 'ok'], ['http_upper', 'denied-policy', 'failed'],
  ['https_control', 'allowed-control', 'ok'], ['relative_lower', 'denied-policy', 'ok'],
  ['relative_mixed', 'denied-policy', 'failed'],
];
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
function publicUrl(value) {
  text(value); let url; try { url = new URL(value); } catch { ensure(false); }
  ensure(url.protocol === 'https:' && !url.username && !url.password && !url.search);
  ensure(['github.com','nvd.nist.gov','osv.dev','rustsec.org','vettalon.dudustudio.monster'].includes(url.hostname));
  if (url.hostname === 'github.com') ensure(/^\/(?:advisories\/GHSA-[a-z0-9-]+|[^/]+\/[^/]+\/(?:security\/advisories\/GHSA-[a-z0-9-]+|commit\/[a-f0-9]{7,40}|blob\/[^/]+\/.+|pull\/\d+(?:\/files)?))$/.test(url.pathname));
  if (url.hostname === 'rustsec.org') ensure(/^\/advisories\/RUSTSEC-\d{4}-\d{4}\.html$/.test(url.pathname));
}
/** Validate an explicitly curated public-only input. Never accepts or silently filters private records. @returns {PublicCase[]} */
export function validateManifest(input) {
  ensure(Array.isArray(input)); const ids = new Set();
  for (const item of input) {
    ensure(item && typeof item === 'object');
    ensure(Object.keys(item).every(k => [...required,...optional].includes(k)) && required.every(k => Object.hasOwn(item,k)));
    ensure(item.publication === 'public' && ['historical','discovery','reported'].includes(item.type) && ['source-reviewed','detected','reproduced','regression-verified'].includes(item.status));
    ensure(typeof item.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) && !ids.has(item.id)); ids.add(item.id);
    for (const key of ['title','summary','boundary','method','limitations','credit']) localized(item[key]);
    for (const key of ['package','sourceVersion','fixedVersion']) text(item[key]);
    ensure(ecosystems.includes(item.ecosystem));
    ensure(item.cve === null ? item.type === 'reported' : typeof item.cve === 'string' && /^CVE-\d{4}-\d{4,}$/.test(item.cve));
    ensure(typeof item.ghsa === 'string' && /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(item.ghsa));
    ensure(item.cwe === null ? item.type === 'reported' : typeof item.cwe === 'string' && /^CWE-\d+$/.test(item.cwe));
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
    if (item.upstreamCreditUrl) publicUrl(item.upstreamCreditUrl);
    if (item.type === 'discovery') { publicUrl(item.upstreamCreditUrl); ensure(item.status === 'reproduced'); }
    if (item.type === 'reported') {
      ensure(item.status === 'regression-verified' && !item.detection && !item.reproduction && !item.dossier);
      ensure(typeof item.rustsecId === 'string' && /^RUSTSEC-\d{4}-\d{4}$/.test(item.rustsecId));
      ensure(item.upstreamCreditUrl === `https://rustsec.org/advisories/${item.rustsecId}.html`);
      ensure(item.regression && typeof item.regression === 'object');
      exactKeys(item.regression, ['artifactPath','sha256','testedAt','checks']);
      ensure(item.regression.artifactPath === `/evidence/regressions/${item.id}.json`);
      digest(item.regression.sha256); date(item.regression.testedAt);
      ensure(item.regression.testedAt <= item.reviewedAt && item.regression.testedAt >= item.publishedAt);
      ensure(Array.isArray(item.regression.checks) && item.regression.checks.length === regressionChecks.length);
      for (let index = 0; index < regressionChecks.length; index++) {
        const check = item.regression.checks[index]; const [id, role, vulnerable] = regressionChecks[index];
        exactKeys(check, ['id','role','vulnerable','fixed']);
        ensure(check.id === id && check.role === role && check.vulnerable === vulnerable && check.fixed === 'ok');
      }
    } else ensure(!item.rustsecId && !item.regression);
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
/** Validate a curated local regression summary; original execution logs remain private. */
export function validateRegression(item, artifact) {
  ensure(item.type === 'reported' && item.status === 'regression-verified' && Boolean(item.regression));
  exactKeys(artifact, ['schemaVersion','caseId','testedAt','scope','arms','checks','limitations']);
  ensure(artifact.schemaVersion === 1 && artifact.caseId === item.id && artifact.testedAt === item.regression.testedAt);
  exactKeys(artifact.scope, ['kind','testCount','inputCount','officialFixedCrate','originalLogsPublic','productScannerUsed']);
  ensure(artifact.scope.kind === 'isolated-library-policy-tests' && artifact.scope.testCount === 5 && artifact.scope.inputCount === 7);
  ensure(artifact.scope.officialFixedCrate === true && artifact.scope.originalLogsPublic === false && artifact.scope.productScannerUsed === false);
  exactKeys(artifact.arms, ['vulnerable','fixed']);
  for (const [name, arm] of Object.entries(artifact.arms)) {
    exactKeys(arm, ['version','testExcerpt','exitCode','passed','failed','filtered']);
    ensure(arm.version === (name === 'vulnerable' ? item.sourceVersion : item.fixedVersion));
    ensure(Array.isArray(arm.testExcerpt) && arm.testExcerpt.length === 6);
    for (const [index, check] of regressionChecks.entries()) {
      const testName = `policy_css_url_${check[0]}${check[0] === 'https_control' ? '' : '_denied'}`;
      const result = name === 'vulnerable' ? check[2] : 'ok';
      ensure(arm.testExcerpt[index] === `test test::${testName} ... ${result === 'ok' ? 'ok' : 'FAILED'}`);
    }
    ensure(arm.testExcerpt[5].startsWith(name === 'vulnerable' ? 'test result: FAILED. 3 passed; 2 failed;' : 'test result: ok. 5 passed; 0 failed;'));
    ensure(Number.isInteger(arm.filtered) && arm.filtered >= 0);
  }
  ensure(artifact.arms.vulnerable.exitCode === 101 && artifact.arms.vulnerable.passed === 3 && artifact.arms.vulnerable.failed === 2 && artifact.arms.vulnerable.filtered === 108);
  ensure(artifact.arms.fixed.exitCode === 0 && artifact.arms.fixed.passed === 5 && artifact.arms.fixed.failed === 0 && artifact.arms.fixed.filtered === 109);
  ensure(Array.isArray(artifact.checks) && artifact.checks.length === regressionChecks.length);
  for (let index = 0; index < regressionChecks.length; index++) {
    const check = artifact.checks[index]; const [name, role, vulnerable] = regressionChecks[index];
    exactKeys(check, ['id','testName','role','vulnerable','fixed']);
    ensure(check.id === name && check.testName === `policy_css_url_${name}${name === 'https_control' ? '' : '_denied'}`);
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
