import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Search, Download } from 'lucide-react';
import { useLocale } from '../locale.js';
import { pagePath } from '../i18n.js';
import { cases } from '../evidence/cases.js';
import DossierPreview from './DossierPreview.jsx';
import EvidenceFunnel from './EvidenceFunnel.jsx';
import { policyText } from '../evidence/policy.js';
import { readFilters, filterQuery, selectCases, BENCHMARK_RUN } from '../evidence/schema.js';

const labels = {
  zh: { dossier: '可核對的原報告節錄', dossierDownload: '下載 finding／覆核節錄（JSON）', dossierDigest: '節錄附件 SHA-256', runStatus: '原掃描執行狀態', dossierNote: '這份節錄保留原 finding 與有效覆核文字，原始報告不公開。節錄雜湊與原報告雜湊不同；人工選編不等於簽章、漏洞確認或可信執行證明。tag 行號只是公開來源參考，不是歷史來源位元組證明。', reproduction: '差分重現證據', artifact: '差分附件', artifactDigest: '附件 SHA-256', vulnerable: '脆弱版本效果', fixedControl: '修補版本效果', normalControl: '正常控制', upstreamCredit: '上游公開歸屬', reproductionNote: '以下為此公開紀錄所附的差分結果；附件與雜湊不單獨證明發現者身份或獨立重現。', origin: 'Vettalon 發現與擬稿紀錄', originDate: '產品輸出日期', originDownload: '下載產品輸出節錄（JSON）', originDigest: '節錄附件 SHA-256', originNote: '歸檔的 Vettalon hunt 輸出列出 Ammonia 4.1.7 的 needs_human 候選，並記錄產生揭露草稿。公開附件只摘錄這一筆；完整原始 hunt.json、JSONL 行、原始 email 與寄件系統收據未公開；第三方無法只靠行雜湊獨立核對原始輸出。維護者在修補 PR 確認收到 email。', regression: '通報後的版本回歸驗證', regressionDownload: '下載五項測試摘要（JSON）', regressionDigest: '摘要附件 SHA-256', regressionNote: '表格中的「通過／失敗」是函式庫政策測試斷言結果。4.2.3 有兩項斷言失敗，官方 4.2.4 五項全通過。這是上游修補後的限定驗證；不能由此推論產品掃描完整流程或瀏覽器驗收。', testCase: '政策測試', testPassed: '通過', testFailed: '失敗', checkNames: { http_lower: '小寫 http', http_upper: '大寫 HTTP', https_control: 'HTTPS 正常控制', relative_lower: '小寫相對路徑', relative_mixed: '混合大小寫相對路徑' }, mode: '模式', verdict: '判定', location: '位置', snapshot: '公開識別證據摘要', finder: '找洞模型', reviewer: '覆核模型與判定', tool: '工具版本', models: '模型版本', scope: '當時範圍', rerun: '重跑識別步驟', rerunNote: '先安裝 Vettalon CLI，並在 config.toml 設定自己的模型與憑證。以下將單一脆弱檔放入聚焦目錄；模型與規則版本可能不同，結果不保證相同。執行 deep 模式會將檔案與上下文送到你設定的模型。這些指令用於識別測試，不會執行上游專案或驗證利用。', rerunArchiveNote: '先安裝 Vettalon CLI，並在 config.toml 設定自己的模型與憑證。以下下載官方發布封存檔、核對 SHA-256 後掃描整個樹；預先登錄檔列出排除的檔案。模型與規則版本可能不同，結果不保證相同。deep 模式會把原始碼送到你設定的模型。這是識別測試，不執行上游專案，也不驗證利用。', title: '證據牆', kicker: 'Vettalon / 研究紀錄', lead: '每筆公開案例分別列出來源、實際測試與尚未驗證的範圍。', historical: '歷史漏洞', discovery: '原創發現', reported: '上游通報', 'source-reviewed': '公開來源核對', detected: '識別命中（歷史測試）', 'not-detected': '未識別（歷史測試）', reproduced: '差分重現通過', 'regression-verified': '修補版回歸驗證', all: '全部', search: '搜尋套件、CVE、GHSA、RustSec 或 CWE', type: '案例類型', status: '驗證狀態', ecosystem: '套件生態', sort: '排序', newest: '公告日期：新到舊', oldest: '公告日期：舊到新', reset: '清除篩選', empty: '沒有符合條件的公開案例', emptyHelp: '調整搜尋或篩選條件。原創發現須完成公開揭露與證據審查，才會加入這裡。', view: '查看證據', count: '筆公開紀錄', boundary: '這筆證據支持什麼', limitation: '限制與前提', method: '測試方法', source: '脆弱版本原始碼', fixed: '上游修補', advisory: '公開公告', versions: '版本與根因', testedVersion: '測試／來源版本', fixedVersion: '上游修補版本', root: '根因分類', date: '公告日期', checked: '來源核對日期', timeline: '時間軸', attribution: '來源與歸屬', back: '回到證據牆', download: '下載公開紀錄（JSON）', digest: '原始識別報告 SHA-256', digestHelp: '雜湊供持有原報告者比對；下載內容為人工整理紀錄，不包含原始掃描報告。', reviewHeading: '人工審閱與 AI 使用', reviewLine: (reviewer, date) => `人工審閱：${reviewer}（${date}）`, missing: '找不到這筆公開案例', missingHelp: '此網址沒有對應的公開紀錄。請回列表查找已公開案例。' },
  en: { dossier: 'Verifiable original-report excerpt', dossierDownload: 'Download finding and review excerpt (JSON)', dossierDigest: 'Excerpt artifact SHA-256', runStatus: 'Original scan run status', dossierNote: 'The excerpt preserves the original finding and any valid review text. The original report is not public. Its digest differs from the excerpt digest; curation is not a signature, vulnerability confirmation or trusted execution proof. The tag and line reference does not establish historical source bytes.', reproduction: 'Differential reproduction evidence', artifact: 'Differential artifact', artifactDigest: 'Artifact SHA-256', vulnerable: 'Vulnerable effect', fixedControl: 'Fixed effect', normalControl: 'Normal control', upstreamCredit: 'Public upstream attribution', reproductionNote: 'These are the differential results attached to this public record. Links and digests alone do not establish discoverer identity or independent reproduction.', origin: 'Vettalon finding and draft record', originDate: 'Product output date', originDownload: 'Download product-output excerpt (JSON)', originDigest: 'Excerpt artifact SHA-256', originNote: 'Archived Vettalon hunt output lists the ammonia 4.1.7 needs_human candidate and generated disclosure draft. The public attachment is limited to this case; the original hunt.json, JSONL line, email and send-system receipt are unavailable, so the line digest alone cannot independently verify the historical output. The maintainer confirms email receipt in the fix PR.', regression: 'Post-report version regression', regressionDownload: 'Download five-check summary (JSON)', regressionDigest: 'Summary artifact SHA-256', regressionNote: 'Pass/fail describes library policy assertions. Two failed on 4.2.3; all five passed on the official 4.2.4 crate. This scoped post-fix test does not validate the complete product scan flow or browser behavior.', testCase: 'Policy test', testPassed: 'Passed', testFailed: 'Failed', checkNames: { http_lower: 'lowercase http', http_upper: 'uppercase HTTP', https_control: 'HTTPS normal control', relative_lower: 'lowercase relative URL', relative_mixed: 'mixed-case relative URL' }, mode: 'Mode', verdict: 'Finding status', location: 'Location', snapshot: 'Public detection evidence snapshot', finder: 'Finder', reviewer: 'Verifier and verdict', tool: 'Tool version', models: 'Model versions', scope: 'Historical scope', rerun: 'Rerun detection', rerunNote: 'Install the Vettalon CLI and configure your models and credentials in config.toml. These steps isolate the vulnerable file for focused review. Model and rule versions may differ; identical results are not guaranteed. Deep mode sends source and context to configured models. This is detection only; it does not run the upstream application or verify exploitation.', rerunArchiveNote: 'Install the Vettalon CLI and configure your models and credentials in config.toml. These steps download the official release archive, check its SHA-256 and scan the whole tree; the pre-registration lists excluded files. Model and rule versions may differ; identical results are not guaranteed. Deep mode sends source to configured models. This is detection only; it does not run the upstream project or verify exploitation.', title: 'Evidence wall', kicker: 'Vettalon / Research records', lead: 'Each published case separates upstream sources, observed tests, and unverified scope.', historical: 'Historical vulnerability', discovery: 'Original discovery', reported: 'Upstream report', 'source-reviewed': 'Public sources reviewed', detected: 'Detection match (historical test)', 'not-detected': 'Not detected (historical test)', reproduced: 'Differential reproduction passed', 'regression-verified': 'Fixed-version regression verified', all: 'All', search: 'Search package, CVE, GHSA, RustSec or CWE', type: 'Case type', status: 'Verification status', ecosystem: 'Ecosystem', sort: 'Sort', newest: 'Advisory date: newest', oldest: 'Advisory date: oldest', reset: 'Clear filters', empty: 'No public cases match these filters', emptyHelp: 'Try another search or clear the filters. Original discoveries are added after public disclosure and evidence review.', view: 'Read evidence', count: 'public records', boundary: 'What this evidence supports', limitation: 'Limits and prerequisites', method: 'Test method', source: 'Vulnerable source', fixed: 'Upstream fix', advisory: 'Public advisory', versions: 'Versions and root cause', testedVersion: 'Test/source version', fixedVersion: 'Upstream fixed version', root: 'Weakness', date: 'Advisory date', checked: 'Sources reviewed', timeline: 'Timeline', attribution: 'Sources and attribution', back: 'Back to evidence wall', download: 'Download public record (JSON)', digest: 'Original detection report SHA-256', digestHelp: 'For comparison by holders of the original report. The download is a curated record, not the raw scan report.', reviewHeading: 'Human review and AI use', reviewLine: (reviewer, date) => `Human review: ${reviewer} (${date})`, missing: 'Public case not found', missingHelp: 'This URL has no public record. Return to the list for published cases.' },
};
const chainLabels = {
  zh: {
    heading: '證據鏈', intro: '依來源逐段核對。缺少的材料會明示，不以公告或修補連結代替產品測試。',
    kinds: '可核對的證據類型', observation: '產品觀測', attribution: '人工／上游歸屬', comparison: '修補對照', unknown: '未驗證範圍',
    origin: '候選與擬稿節錄', dossier: '歷史識別節錄', record: '人工整理紀錄（非原始輸出）',
    upstream: '上游公開歸屬', advisory: '上游公告', regression: '版本回歸摘要', differential: '差分附件', httpPair: '本地 HTTP 雙版本證據包',
    noComparison: '未提供修補版對照', noOrigin: '未提供可核對的產品輸出',
    noOriginText: '此案沒有公開的原始產品輸出附件。下方人工整理紀錄只彙整公開欄位，不能證明產品曾產生這筆候選。',
    recordNote: '另有人工整理紀錄；它不是產品觀測附件。',
    originText: '產品輸出為 needs_human 候選與揭露草稿；完整原始執行材料未公開。',
    historicalText: '僅是已知漏洞的歷史聚焦識別；不代表原創發現或利用成功。',
    regressionText: '公開摘要列出相同政策測試在脆弱版與官方修補版的結果。',
    differentialText: '差分附件列出脆弱效果、修補效果與正常控制。',
    httpPairText: '另行完成已知 CVE 的本地固定輸入 HTTP 四格對照；歷史產品候選仍是 needs_human。',
    noComparisonText: '此紀錄只有上游修補來源，未執行脆弱版與修補版的差分或回歸測試。',
    limitsLink: '閱讀限制', fixLink: '查看上游修補',
    benchmark: '封存版本掃描結果', benchmarkControl: '修補版掃描對照',
    benchmarkFoundText: '以發布封存檔做 L0 掃描（不給提示），輸出符合掃描前登錄的位置與 CWE；這是已知漏洞的識別，不代表原創發現或利用成功。',
    benchmarkMissText: '以發布封存檔做 L0 掃描（不給提示），輸出沒有符合掃描前登錄的標準。這筆未命中照樣公開。',
    benchmarkControlText: '同一組參數也掃了上游修補版，記錄修補後的程式碼是否仍被標記。這是掃描對照，不是利用或差分測試。',
  },
  en: {
    heading: 'Evidence chain', intro: 'Follow each source in order. Missing material is explicit; an advisory or fix link does not stand in for a product test.',
    kinds: 'Available evidence types', observation: 'Product observation', attribution: 'Human / upstream attribution', comparison: 'Fixed-version comparison', unknown: 'Unverified scope',
    origin: 'Candidate and draft excerpt', dossier: 'Historical finding excerpt', record: 'Curated record (not original output)',
    upstream: 'Public upstream credit', advisory: 'Upstream advisory', regression: 'Version regression summary', differential: 'Differential artifact', httpPair: 'Local paired HTTP evidence ZIP',
    noComparison: 'No fixed-version comparison', noOrigin: 'No verifiable product output provided',
    noOriginText: 'This case has no public original product-output artifact. The curated record below summarizes public fields; it does not prove the product generated this candidate.',
    recordNote: 'A curated record is available separately; it is not a product-observation artifact.',
    originText: 'The product output is a needs_human candidate and disclosure draft; the full original run material is not public.',
    historicalText: 'This is a historical focused detection of a known issue, not an original discovery or successful exploit.',
    regressionText: 'The public summary compares the same policy checks on the vulnerable and official fixed versions.',
    differentialText: 'The differential artifact lists vulnerable, fixed, and normal-control effects.',
    httpPairText: 'A separate local fixed-input HTTP four-cell pair tests this known CVE; the historical product candidate remains needs_human.',
    noComparisonText: 'An upstream fix source exists, but this record has no vulnerable-versus-fixed differential or regression run.',
    limitsLink: 'Read limits', fixLink: 'View upstream fix',
    benchmark: 'Release-archive scan result', benchmarkControl: 'Fixed-release scan control',
    benchmarkFoundText: 'An L0 scan (no hints) of the released archive produced a finding that meets the location and CWE criteria registered before the scan. This is detection of a known issue, not an original discovery or a successful exploit.',
    benchmarkMissText: 'An L0 scan (no hints) of the released archive produced no finding that meets the criteria registered before the scan. The miss is published like any other result.',
    benchmarkControlText: 'The upstream fixed release was scanned with the same parameters to see whether the patched code is still flagged. This is a scan control, not an exploit or differential test.',
  },
};
const pairedLabels = {
  zh: {
    title: '官方雙版本原始證據包',
    note: '這是通報修補後另行執行的固定 caller-policy 屬性回歸：Ammonia 4.2.3 五項中 3 過、2 項預期失敗；官方 4.2.4 五項全過，兩版 HTTPS 正常控制均通過。ZIP 含兩版 raw stdout／stderr、收據、來源指紋、測試 harness、runner 與離線 verifier。這不是原始 Vettalon 獵捕紀錄，也不證瀏覽器 XSS 或產品自動檢出率。pinned vendor payload 未公開；離線驗證只證封存內部一致。',
    download: '下載原始證據與離線驗證 ZIP',
    digest: 'ZIP SHA-256',
  },
  en: {
    title: 'Official-version paired raw evidence',
    note: 'This is a separate post-fix, fixed caller-policy property regression: Ammonia 4.2.3 passed 3/5 with two expected policy failures; official 4.2.4 passed 5/5. The allowed HTTPS control passed on both. The ZIP includes both arms’ raw stdout/stderr, receipt, source pins, test harness, runner and offline verifier. It is not the original Vettalon hunt, and does not establish browser XSS or a product detection rate. The pinned vendor payload is withheld; offline verification checks archive consistency only.',
    download: 'Download raw evidence and offline verifier (ZIP)',
    digest: 'ZIP SHA-256',
  },
};
const aiohttpPairedLabels = {
  zh: {
    title: 'aiohttp 官方雙版本本地 HTTP 證據包',
    note: '這是與歷史聚焦識別分開的已知 CVE 固定輸入測試。官方 3.9.1 對自造 GET /../private_file 回 200 與 37-byte marker，官方 3.9.2 回 404 且無 marker；GET /public.txt 在兩版均回 200 與相同 37-byte 正常內容。Fixture 無 symlink。ZIP 含 run-08 兩版 raw HTTP、收據、來源釘選、runner 與離線 verifier。這不升級原 needs_human 判定；不證產品檢出率、任意服務遠端可達性或顯式 symlink 設定安全。離線驗證只核對封存內部一致。',
    download: '下載 HTTP 原始證據與離線驗證 ZIP',
    digest: 'ZIP SHA-256',
  },
  en: {
    title: 'Official-version local aiohttp HTTP pair',
    note: 'This is a separate fixed-input test of a known CVE. Official 3.9.1 returned 200 with a self-authored 37-byte marker for GET /../private_file; official 3.9.2 returned 404 without the marker. GET /public.txt returned 200 with the same 37-byte normal body on both. The fixture had no symlink. The ZIP includes run-08 raw HTTP from both versions, the receipt, source pins, runner and offline verifier. This does not upgrade the historical needs_human verdict or establish a product detection rate, arbitrary-service reachability, or safety for explicit symlink configurations. Offline verification checks archive consistency only.',
    download: 'Download raw HTTP evidence and offline verifier (ZIP)',
    digest: 'ZIP SHA-256',
  },
};
const benchmarkLabels = {
  zh: {
    title: '預先登錄的封存版本掃描', note: '兩個臂都掃官方發布的封存檔（非 git 歷史），參數相同，模型輸入不含 CVE 編號、公告文字或修補 diff。命中與否依掃描前公開登錄的檔案、行號範圍與 CWE 判定；其他輸出只列數量，未審閱。修補版「未被標記」只代表對應範圍沒有符合標準的輸出。模型可能在訓練時看過這份公告，候選也不等於自動確認。',
    arm: '掃描臂', version: '版本', outcome: '判定', calls: '模型呼叫', runStatus: '執行狀態', targetReviewed: '目標檔送審', yes: '是', no: '否', vulnerable: '脆弱版', fixed: '修補版',
    outcomes: { found: '命中', foundButRefuted: '找到但被覆核駁回', locationOnly: '位置相符、CWE 不符', missedReviewed: '未命中（目標檔已審）', missedNotSelected: '未命中（目標檔未進入審查）', notRun: '未執行', flagged: '仍被標記', notFlagged: '未被標記' },
    download: '下載本案掃描摘要（JSON）', digest: '摘要附件 SHA-256', prereg: '比對標準在第一次掃描前公開登錄：', preregLink: '預先登錄檔（JSON）', preregDigest: '預先登錄檔 SHA-256',
  },
  en: {
    title: 'Pre-registered release-archive scan', note: 'Both arms scan the official release archive (no git history) with the same parameters. Model input contains no CVE id, advisory text or fix diff. A match is judged against the file, line ranges and CWE registered publicly before the first scan; other output is listed as counts only and was not reviewed. "Not flagged" on the fixed release only means nothing in the corresponding range met the criteria. The models may have seen this advisory during training, and a candidate is not an automatic confirmation.',
    arm: 'Arm', version: 'Version', outcome: 'Result', calls: 'Model calls', runStatus: 'Run status', targetReviewed: 'Target file reviewed', yes: 'yes', no: 'no', vulnerable: 'Vulnerable', fixed: 'Fixed',
    outcomes: { found: 'Found', foundButRefuted: 'Found, then refuted by verifier', locationOnly: 'Location matched, CWE did not', missedReviewed: 'Missed (target file reviewed)', missedNotSelected: 'Missed (target file not audited)', notRun: 'Not run', flagged: 'Still flagged', notFlagged: 'Not flagged' },
    download: 'Download case scan summary (JSON)', digest: 'Summary artifact SHA-256', prereg: 'Match criteria were registered publicly before the first scan:', preregLink: 'Pre-registration (JSON)', preregDigest: 'Pre-registration SHA-256',
  },
};
const featuredLabels = {
  zh: {
    eyebrow: '精選案例 / Ammonia', title: '從產品候選到上游修補',
    intro: 'Vettalon 對 ammonia 4.1.7 提出 needs_human 候選與揭露草稿；Louis Li 人工重現、送件，上游修補。以下是各段可核對的材料。',
    candidate: '候選與擬稿', candidateText: '公開的是 4.1.7 產品輸出的人工選編節錄；完整原始 hunt 未公開。', candidateLink: '查看輸出節錄',
    report: '人工通報', reportText: '維護者在修補 PR 確認收到 email；RustSec 列 Louis Li 為通報者。', reportLink: '修補 PR', creditLink: 'RustSec 歸屬',
    comparison: '修補後回歸', comparisonText: '通報修補後另行執行的固定 caller-policy 測試，使用官方雙版本：', comparisonLink: '下載原始證據包',
    boundary: '證據邊界', boundaryText: '上述通過數是後續政策測試結果，不是原始獵捕命中率；未驗證瀏覽器 XSS 或完整應用流程。', detailLink: '閱讀完整紀錄與限制',
  },
  en: {
    eyebrow: 'Featured case / Ammonia', title: 'From candidate to upstream fix',
    intro: 'Vettalon produced a needs_human candidate and disclosure draft for ammonia 4.1.7. Louis Li reproduced and submitted it; upstream fixed it. Follow the evidence for each step.',
    candidate: 'Candidate and draft', candidateText: 'The public excerpt curates the 4.1.7 product output; the full original hunt is unavailable.', candidateLink: 'Read output excerpt',
    report: 'Human report', reportText: 'The maintainer confirms email receipt in the fix PR; RustSec credits Louis Li as reporter.', reportLink: 'Fix PR', creditLink: 'RustSec credit',
    comparison: 'Post-fix regression', comparisonText: 'A separate fixed caller-policy test after the report and fix, using two official versions:', comparisonLink: 'Download raw evidence bundle',
    boundary: 'Evidence boundary', boundaryText: 'These pass counts belong to the later policy test, not the original hunt detection rate; browser XSS and complete application flow remain untested.', detailLink: 'Read full record and limits',
  },
};

export function FeaturedAmmonia({ item, locale }) {
  if (!item?.origin || !item.regression || !item.pairedBundle || !item.upstreamCreditUrl) return null;
  const t = featuredLabels[locale];
  const checks = item.regression.checks;
  const sourcePassed = checks.filter(check => check.vulnerable === 'ok').length;
  const fixedPassed = checks.filter(check => check.fixed === 'ok').length;
  const detail = pagePath(locale, `evidence/${item.id}`);
  return <section className="evidence__featured" aria-labelledby="evidence-featured-title">
    <div className="evidence__featured-head"><p className="eyebrow">{t.eyebrow}</p><h2 id="evidence-featured-title">{t.title}</h2><p>{t.intro}</p></div>
    <ol className="evidence__featured-steps">
      <li><span className="evidence__featured-number" aria-hidden="true">01</span><h3>{t.candidate}</h3><p>{t.candidateText}</p><a href={item.origin.artifactPath}>{t.candidateLink}<ArrowUpRight size={15} aria-hidden="true" /></a></li>
      <li><span className="evidence__featured-number" aria-hidden="true">02</span><h3>{t.report}</h3><p>{t.reportText}</p><div className="evidence__featured-links"><ExternalLink href={item.fixUrl}>{t.reportLink}</ExternalLink><ExternalLink href={item.upstreamCreditUrl}>{t.creditLink}</ExternalLink></div></li>
      <li><span className="evidence__featured-number" aria-hidden="true">03</span><h3>{t.comparison}</h3><p>{t.comparisonText} <strong className="mono">{item.sourceVersion} {sourcePassed}/{checks.length} → {item.fixedVersion} {fixedPassed}/{checks.length}</strong></p><a href={item.pairedBundle.artifactPath}>{t.comparisonLink}<ArrowUpRight size={15} aria-hidden="true" /></a></li>
      <li><span className="evidence__featured-number" aria-hidden="true">04</span><h3>{t.boundary}</h3><p>{t.boundaryText}</p><a href={detail}>{t.detailLink}<ArrowUpRight size={15} aria-hidden="true" /></a></li>
    </ol>
  </section>;
}

function EvidenceTypes({ item, locale }) {
  const t = chainLabels[locale];
  const types = [
    item.origin ? { label: t.origin } : item.dossier ? { label: t.dossier } : item.benchmark ? { label: t.benchmark } : { label: t.noOrigin, missing: true },
    ...(!item.origin && !item.dossier && !item.benchmark ? [{ label: t.record }] : []),
    { label: item.upstreamCreditUrl ? t.upstream : t.advisory },
    item.regression ? { label: t.regression } : item.reproduction ? { label: t.differential } : item.id === 'aiohttp-cve-2024-23334' && item.pairedBundle ? { label: t.httpPair } : benchmarkControl(item) ? { label: t.benchmarkControl } : { label: t.noComparison, missing: true },
  ];
  return <ul className="evidence__types" aria-label={t.kinds}>{types.map(({ label, missing }) => <li key={label} data-state={missing ? 'missing' : 'available'}>{label}</li>)}</ul>;
}

function EvidenceLadder({ item, locale }) {
  const t = chainLabels[locale];
  const observation = item.origin?.artifactPath ?? item.dossier?.artifactPath ?? item.benchmark?.artifactPath;
  const observationLabel = item.origin ? t.origin : item.dossier ? t.dossier : t.benchmark;
  const observationText = item.origin ? t.originText : item.benchmark ? (item.status === 'detected' ? t.benchmarkFoundText : t.benchmarkMissText) : t.historicalText;
  const attribution = item.upstreamCreditUrl ?? item.advisoryUrl;
  const comparison = item.regression?.artifactPath ?? item.reproduction?.artifactUrl ?? (item.id === 'aiohttp-cve-2024-23334' ? item.pairedBundle?.artifactPath : undefined) ?? (benchmarkControl(item) ? item.benchmark.artifactPath : undefined);
  return <section className="evidence__chain" aria-labelledby="evidence-chain-heading">
    <div className="evidence__chain-head"><h2 id="evidence-chain-heading">{t.heading}</h2><p>{t.intro}</p></div>
    <ol className="evidence__chain-steps">
      <li data-state={observation ? 'available' : 'missing'}><h3>{t.observation}</h3><p>{observation ? observationText : t.noOriginText}</p>{observation && <a href={observation}>{observationLabel}<ArrowUpRight size={15} aria-hidden="true" /></a>}</li>
      <li><h3>{t.attribution}</h3><p>{item.credit[locale]}</p><ExternalLink href={attribution}>{item.upstreamCreditUrl ? t.upstream : t.advisory}</ExternalLink></li>
      <li data-state={comparison ? 'available' : 'missing'}><h3>{t.comparison}</h3><p>{item.regression ? t.regressionText : item.reproduction ? t.differentialText : item.pairedBundle && item.id === 'aiohttp-cve-2024-23334' ? t.httpPairText : benchmarkControl(item) ? t.benchmarkControlText : t.noComparisonText}</p>{comparison ? (item.regression ? <a href={comparison}>{t.regression}<ArrowUpRight size={15} aria-hidden="true" /></a> : item.reproduction ? <ExternalLink href={comparison}>{t.differential}</ExternalLink> : item.pairedBundle ? <a href={comparison}>{t.httpPair}<ArrowUpRight size={15} aria-hidden="true" /></a> : <a href={comparison}>{t.benchmarkControl}<ArrowUpRight size={15} aria-hidden="true" /></a>) : <ExternalLink href={item.fixUrl}>{t.fixLink}</ExternalLink>}</li>
      <li><h3>{t.unknown}</h3><p>{item.limitations[locale]}</p><a href="#evidence-limits">{t.limitsLink}<ArrowUpRight size={15} aria-hidden="true" /></a></li>
    </ol>
    {!observation && <p className="evidence__curated-record">{t.recordNote} <a href={`/evidence/records/${item.id}.json`}>{t.record}<ArrowUpRight size={15} aria-hidden="true" /></a></p>}
  </section>;
}
function benchmarkControl(item) { return Boolean(item.benchmark && item.benchmark.fixed.outcome !== 'notRun'); }
function BenchmarkSection({ item, locale }) {
  const t = benchmarkLabels[locale]; const b = item.benchmark;
  const rows = [['vulnerable', item.sourceVersion, b.vulnerable], ['fixed', item.fixedVersion, b.fixed]];
  return <section className="evidence__section" data-benchmark-outcome={b.vulnerable.outcome}><h2>{t.title}</h2><p>{t.note}</p><div className="evidence__regression-scroll"><table className="evidence__regression-table"><thead><tr><th scope="col">{t.arm}</th><th scope="col">{t.version}</th><th scope="col">{t.outcome}</th><th scope="col">{t.calls}</th><th scope="col">{t.runStatus}</th><th scope="col">{t.targetReviewed}</th></tr></thead><tbody>{rows.map(([arm, version, summary]) => <tr key={arm}><th scope="row">{t[arm]}</th><td>{version}</td><td>{t.outcomes[summary.outcome]}</td><td>{summary.calls}</td><td>{summary.runStatus ? `${summary.runStatus}${summary.incompleteReason ? ` (${summary.incompleteReason})` : ''}` : '—'}</td><td>{summary.targetReviewed === null ? '—' : summary.targetReviewed ? t.yes : t.no}</td></tr>)}</tbody></table></div><a className="evidence__download" href={b.artifactPath} download><Download size={17} />{t.download}</a><details className="evidence__digest" open><summary>{t.digest}</summary><code>{b.sha256}</code></details><p>{t.prereg} <a href={BENCHMARK_RUN.preregistration.artifactPath}>{t.preregLink}<ArrowUpRight size={15} aria-hidden="true" /></a></p><details className="evidence__digest"><summary>{t.preregDigest}</summary><code>{BENCHMARK_RUN.preregistration.sha256}</code></details></section>;
}
function ExternalLink({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15} aria-hidden="true" /></a>; }
function Facet({ label, name, value, values, t, onChange }) {
  return <label className="evidence__field"><span>{label}</span><select name={name} value={value} onChange={e => onChange(name,e.target.value)}><option value="">{t.all}</option>{values.map(v => <option key={v} value={v}>{t[v] || v}</option>)}</select></label>;
}
export default function EvidencePage({ page }) {
  const locale = useLocale(); const t = labels[locale]; const [filters, setFilters] = useState(() => readFilters());
  useEffect(() => {
    const sync = () => setFilters(readFilters(window.location.search)); sync();
    window.addEventListener('popstate',sync); return () => window.removeEventListener('popstate',sync);
  }, []);
  const update = (key,value) => {
    const next = key === 'reset' ? readFilters() : { ...filters,[key]:value };
    setFilters(next); window.history.replaceState(null,'',window.location.pathname + filterQuery(next));
    window.dispatchEvent(new Event('vettalon:filters'));
  };
  const id = page.split('/')[1]; const item = id ? cases.find(c => c.id === id) : null;
  const paired = item?.id === 'aiohttp-cve-2024-23334' ? aiohttpPairedLabels[locale] : pairedLabels[locale];
  if (id) return <article className="evidence evidence--detail wrap">
    <a className="evidence__back" href={pagePath(locale,'evidence')}><ArrowLeft size={16} />{t.back}</a>
    {!item ? <><h1>{t.missing}</h1><p>{t.missingHelp}</p></> : <>
      <p className="eyebrow">{item.package} / {item.cve ?? item.ghsa}</p>
      <h1>{item.title[locale]}</h1>
      <div className="evidence__badges"><span>{t[item.type]}</span><span>{t[item.status]}</span><span>{item.ecosystem}</span></div>
      <p className="evidence__lead">{item.summary[locale]}</p>
      <EvidenceLadder item={item} locale={locale} />
      <div className="evidence__detail-grid"><div>
        <section className="evidence__section evidence__boundary"><h2>{t.boundary}</h2><p>{item.boundary[locale]}</p></section>
        <section className="evidence__section"><h2>{t.method}</h2><p>{item.method[locale]}</p>{item.detection && <dl className="evidence__facts"><div><dt>{t.mode}</dt><dd>{item.detection.mode}</dd></div><div><dt>{t.verdict}</dt><dd>{item.detection.findingStatus}</dd></div><div><dt>{t.location}</dt><dd><code>{item.detection.file}:{item.detection.line}</code></dd></div></dl>}<a className="evidence__download" href={`/evidence/records/${item.id}.json`} download><Download size={17} />{t.download}</a></section>
        {item.detection && <><section className="evidence__section"><h2>{t.snapshot}</h2><p>{item.detection.claim[locale]}</p><p className="evidence__review">{item.detection.reviewerConclusion[locale]}</p><dl className="evidence__facts">{[[t.finder,item.detection.finder],[t.reviewer,item.detection.reviewer],[t.tool,item.detection.toolVersion],[t.models,item.detection.modelVersions],[t.scope,item.detection.scope]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section><section className="evidence__section"><h2>{t.rerun}</h2><p>{item.detection.mode === 'release-archive' ? t.rerunArchiveNote : t.rerunNote}</p><pre className="evidence__commands"><code>{item.detection.rerun}</code></pre></section></>}
        {item.dossier && <section className="evidence__section"><h2>{t.dossier}</h2><p>{t.dossierNote}</p><a className="evidence__download" href={item.dossier.artifactPath} download><Download size={17} />{t.dossierDownload}</a><dl className="evidence__facts"><div><dt>{t.runStatus}</dt><dd>{item.dossier.runStatus}{item.dossier.incompleteReason ? ` / ${item.dossier.incompleteReason}` : ''}</dd></div></dl><details className="evidence__digest" open><summary>{t.dossierDigest}</summary><code>{item.dossier.sha256}</code></details><DossierPreview key={item.id} item={item} /></section>}
        {item.origin && <section className="evidence__section"><h2>{t.origin}</h2><p>{t.originNote}</p><dl className="evidence__facts"><div><dt>{t.originDate}</dt><dd>{item.origin.observedAt} UTC</dd></div><div><dt>{t.verdict}</dt><dd>{item.origin.findingStatus}</dd></div></dl><a className="evidence__download" href={item.origin.artifactPath} download><Download size={17} />{t.originDownload}</a><details className="evidence__digest" open><summary>{t.originDigest}</summary><code>{item.origin.sha256}</code></details></section>}
        {item.regression && <section className="evidence__section"><h2>{t.regression}</h2><p>{t.regressionNote}</p><div className="evidence__regression-scroll"><table className="evidence__regression-table"><thead><tr><th scope="col">{t.testCase}</th><th scope="col">{item.sourceVersion}</th><th scope="col">{item.fixedVersion}</th></tr></thead><tbody>{item.regression.checks.map(check => <tr key={check.id}><th scope="row">{t.checkNames[check.id]}</th><td>{check.vulnerable === 'ok' ? t.testPassed : t.testFailed}</td><td>{check.fixed === 'ok' ? t.testPassed : t.testFailed}</td></tr>)}</tbody></table></div><a className="evidence__download" href={item.regression.artifactPath} download><Download size={17} />{t.regressionDownload}</a><details className="evidence__digest" open><summary>{t.regressionDigest}</summary><code>{item.regression.sha256}</code></details></section>}
        {item.pairedBundle && <section className="evidence__section"><h2>{paired.title}</h2><p>{paired.note}</p><a className="evidence__download" href={item.pairedBundle.artifactPath} download><Download size={17} />{paired.download}</a><details className="evidence__digest" open><summary>{paired.digest}</summary><code>{item.pairedBundle.sha256}</code></details></section>}
        {item.benchmark && <BenchmarkSection item={item} locale={locale} />}
        {item.reproduction && <section className="evidence__section"><h2>{t.reproduction}</h2><p>{t.reproductionNote}</p><ExternalLink href={item.reproduction.artifactUrl}>{t.artifact}</ExternalLink><dl className="evidence__facts">{[[t.vulnerable,item.reproduction.vulnerable],[t.fixedControl,item.reproduction.fixed],[t.normalControl,item.reproduction.control]].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><details className="evidence__digest" open><summary>{t.artifactDigest}</summary><code>{item.reproduction.sha256}</code></details></section>}
        {item.upstreamCreditUrl && <section className="evidence__section"><h2>{t.upstreamCredit}</h2><ExternalLink href={item.upstreamCreditUrl}>{t.upstreamCredit}</ExternalLink></section>}
        <section className="evidence__section" id="evidence-limits"><h2>{t.limitation}</h2><p>{item.limitations[locale]}</p></section>
        <section className="evidence__section"><h2>{t.attribution}</h2><p>{item.credit[locale]}</p><div className="evidence__sources"><ExternalLink href={item.advisoryUrl}>{t.advisory} · {item.ghsa}</ExternalLink><ExternalLink href={item.sourceUrl}>{t.source} · {item.sourceVersion}</ExternalLink><ExternalLink href={item.fixUrl}>{t.fixed}</ExternalLink></div></section>
        {item.detection && <details className="evidence__digest"><summary>{t.digest}</summary><p>{t.digestHelp}</p><code>{item.detection.sha256}</code></details>}
      </div><aside>
        {item.review && <section className="evidence__section evidence__human-review"><h2>{t.reviewHeading}</h2><p className="evidence__reviewer">{t.reviewLine(item.review.reviewer, item.review.reviewedAt)}</p><p>{item.review.aiUse[locale]}</p></section>}
        <section className="evidence__section"><h2>{t.versions}</h2><dl className="evidence__facts">{[[t.testedVersion,item.sourceVersion],[t.fixedVersion,item.fixedVersion],[t.root,item.cwe],[t.date,item.publishedAt],[t.checked,item.reviewedAt]].filter(([,v]) => v !== null).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>
        <section className="evidence__section"><h2>{t.timeline}</h2><ol className="evidence__timeline">{item.timeline.map((entry,i) => <li key={i}><time dateTime={entry.date}>{entry.date}</time><p>{entry.event[locale]}</p></li>)}</ol></section>
      </aside></div>
    </>}
  </article>;
  const results = selectCases(cases,filters);
  return <div className="evidence wrap">
    <header className="evidence__head"><p className="eyebrow">{t.kicker}</p><h1>{t.title}<span aria-hidden="true"> /</span></h1><p className="evidence__lead">{t.lead}</p></header>
    <p className="evidence__policy">{policyText(locale, cases)}</p>
    <FeaturedAmmonia item={results.find(c => c.id === 'ammonia-ghsa-x43w-36pp-96g3')} locale={locale} />
    <form className="evidence__filters" role="search" onSubmit={e => e.preventDefault()}>
      <label className="evidence__search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t.search}</span><input name="q" type="search" maxLength={200} placeholder={t.search} value={filters.q} onChange={e => update('q',e.target.value)} /></label>
      <div className="evidence__facets"><Facet label={t.type} name="type" value={filters.type} values={['historical','reported','discovery']} t={t} onChange={update}/><Facet label={t.status} name="status" value={filters.status} values={['source-reviewed','detected','not-detected','regression-verified','reproduced']} t={t} onChange={update}/><Facet label={t.ecosystem} name="ecosystem" value={filters.ecosystem} values={['PyPI','npm','Packagist','Cargo','Go','RubyGems']} t={t} onChange={update}/><label className="evidence__field"><span>{t.sort}</span><select name="sort" value={filters.sort} onChange={e => update('sort',e.target.value)}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option></select></label></div>
    </form>
    <div className="evidence__results-bar"><p role="status" aria-live="polite">{results.length} {locale === 'en' && results.length === 1 ? 'public record' : t.count}</p><button type="button" onClick={() => update('reset')}>{t.reset}</button></div>
    <div className="evidence__list">{results.length ? results.map(c => <article className="evidence__row" key={c.id}>
      <div className="evidence__package"><strong>{c.package}</strong><span>{c.ecosystem}</span>{c.cwe && <span>{c.cwe}</span>}</div>
      <div className="evidence__case"><div className="evidence__badges"><span>{t[c.type]}</span><span>{t[c.status]}</span></div><h2><a href={pagePath(locale,'evidence/' + c.id)}>{c.title[locale]}</a></h2><p>{c.summary[locale]}</p><EvidenceTypes item={c} locale={locale} /><p className="evidence__case-boundary">{c.boundary[locale]}</p><div className="evidence__case-meta"><span>{c.cve ?? c.ghsa}</span><time dateTime={c.publishedAt}>{c.publishedAt}</time></div></div>
      <a className="evidence__view" href={pagePath(locale,'evidence/' + c.id)} aria-label={`${t.view}: ${c.package} ${c.cve ?? c.ghsa}`}>{t.view}<ArrowUpRight size={18} aria-hidden="true" /></a>
    </article>) : <div className="evidence__empty"><h2>{t.empty}</h2><p>{t.emptyHelp}</p><button type="button" onClick={() => update('reset')}>{t.reset}</button></div>}</div>
    <EvidenceFunnel cases={cases} locale={locale} />
  </div>;
}
