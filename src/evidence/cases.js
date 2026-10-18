import { validateManifest } from './schema.js';

// Curated public records only. Never import scan/disclosure directories here.
/** @type {import('./schema.js').PublicCase[]} */
const reviewed = [
  {
    id: 'aiohttp-cve-2024-23334', publication: 'public', reviewedAt: '2026-10-16', type: 'historical', status: 'detected', package: 'aiohttp', ecosystem: 'PyPI',
    title: { zh: '靜態檔案路徑穿越', en: 'Static file path traversal' },
    summary: { zh: '啟用 follow_symlinks 時，靜態資源缺少目錄範圍檢查，可能讀到靜態根目錄外的檔案。', en: 'Static resource handling with follow_symlinks enabled can expose files outside the static root.' },
    cve: 'CVE-2024-23334', ghsa: 'GHSA-5h86-8mv2-jq9f', cwe: 'CWE-22', sourceVersion: 'v3.9.1', fixedVersion: '3.9.2',
    sourceUrl: 'https://github.com/aio-libs/aiohttp/blob/v3.9.1/aiohttp/web_urldispatcher.py',
    advisoryUrl: 'https://github.com/aio-libs/aiohttp/security/advisories/GHSA-5h86-8mv2-jq9f',
    fixUrl: 'https://github.com/aio-libs/aiohttp/pull/8079/files', publishedAt: '2024-01-29',
    boundary: { zh: '歷史聚焦掃描識別命中 web_urldispatcher.py:666，最終為 needs_human。未執行 HTTP 利用或修補版本對照。', en: 'Historical focused scan matched web_urldispatcher.py:666, ending at needs_human. No HTTP exploit or fixed-version comparison was executed.' },
    method: { zh: '將 v3.9.1 的脆弱檔納入聚焦 AI 審查，交由不同家族模型覆核。可下載經整理的識別紀錄；原始檔雜湊供持有原報告者比對。', en: 'Focused AI review of the vulnerable file with cross-family verification. The curated detection record includes a digest for holders of the original report.' },
    limitations: { zh: '識別命中不能證明可利用性或整庫召回。只在啟用特定靜態路由設定時受影響。', en: 'A detection match does not establish exploitability or whole-repository recall. Exposure depends on static route configuration.' },
    credit: { zh: '原始發現者與修補者請見 aiohttp 公告 Credits；Vettalon 僅做歷史識別測試。', en: 'Original reporter and remediation credits belong to the aiohttp advisory. Vettalon performed a historical detection test.' },
    detection: { mode: 'focused', findingStatus: 'needs_human', file: 'web_urldispatcher.py', line: 666, observedAt: '2026-10-12', claim: { zh: 'StaticResource._handle 在 follow_symlinks=True 時略過目錄範圍檢查；識別位置為 web_urldispatcher.py:666。', en: 'StaticResource._handle skips containment validation when follow_symlinks=True, identified at web_urldispatcher.py:666.' }, reviewerConclusion: { zh: 'codex：plausible。片段支援路徑穿越假設，遠端可利用性仍待驗證。', en: 'codex: plausible. The excerpt supports the path traversal hypothesis; remote exploitability remains unverified.' }, finder: 'claude (Anthropic alias)', reviewer: 'codex (OpenAI alias): plausible', toolVersion: 'Not recorded in historical report (schema v2)', modelVersions: 'Exact model versions not recorded; aliases only', scope: 'Single file: web_urldispatcher.py; focused deep AI review; no truncation recorded', rerun: 'git clone --branch v3.9.1 --depth 1 https://github.com/aio-libs/aiohttp.git aiohttp-case\nmkdir -p aiohttp-focused\ncp aiohttp-case/aiohttp/web_urldispatcher.py aiohttp-focused/\nvettalon scan ./aiohttp-focused --profile deep --config ./config.toml --max-modules 8 --cross-check-top 8 --report ./aiohttp-result.json --no-prior', sha256: '031e2f8893a9fd7f98086e4198334864286ff87e2e999841e3caea176f85a388' },
    dossier: {"artifactPath": "/evidence/dossiers/aiohttp-cve-2024-23334.json", "sha256": "b70361afe9a0f600e09718766a069d739202b047d75d2e9b617733f11c507588", "runStatus": "complete", "incompleteReason": null},
    timeline: [{ date: '2024-01-29', event: { zh: '上游公開公告與修補版本', en: 'Upstream advisory published' } },{ date: '2026-10-12', event: { zh: '聚焦識別測試，待人工確認', en: 'Focused detection; human review required' } },{ date: '2026-10-16', event: { zh: '公開來源與紀錄邊界核對', en: 'Public sources and evidence boundary reviewed' } }],
  },
  {
    id: 'phpunit-cve-2017-9841', publication: 'public', reviewedAt: '2026-10-16', type: 'historical', status: 'detected', package: 'PHPUnit', ecosystem: 'Packagist',
    title: { zh: '測試輔助程式的程式碼注入', en: 'Code injection in a test helper' },
    summary: { zh: '部署在可由網路存取的位置時，舊版 eval-stdin.php 可能將 HTTP 請求內容當作 PHP 執行。', en: 'A web-accessible legacy eval-stdin.php can execute PHP supplied in an HTTP request body.' },
    cve: 'CVE-2017-9841', ghsa: 'GHSA-r7c9-c69m-rph8', cwe: 'CWE-94', sourceVersion: '5.6.2', fixedVersion: '4.8.28 / 5.6.3',
    sourceUrl: 'https://github.com/sebastianbergmann/phpunit/blob/5.6.2/src/Util/PHP/eval-stdin.php',
    advisoryUrl: 'https://github.com/advisories/GHSA-r7c9-c69m-rph8', fixUrl: 'https://github.com/sebastianbergmann/phpunit/commit/284a69fb88a2d0845d23f42974a583d8f59bf5a5', publishedAt: '2017-06-27',
    boundary: { zh: '歷史聚焦掃描識別命中 eval-stdin.php:3，最終為 candidate。未在 web SAPI 執行，未驗證修補後的行為。', en: 'Historical focused scan matched eval-stdin.php:3 as a candidate. No web SAPI execution or fixed-version comparison was performed.' },
    method: { zh: '將 5.6.2 的輔助程式交給聚焦 AI 審查，保留候選狀態與位置。下載紀錄附原報告雜湊。', en: 'Focused AI review of the 5.6.2 helper, retaining the candidate verdict and location. The record includes the original report digest.' },
    limitations: { zh: '須有可由 HTTP 存取的測試工具檔案。這筆紀錄沒有端到端利用證據，也不代表 Vettalon 發現新漏洞。', en: 'Requires an HTTP-accessible test helper. This record contains no end-to-end exploit evidence and claims no new discovery.' },
    credit: { zh: '已公開歷史漏洞；原始來源與分析者見公告。Vettalon 僅做識別測試。', en: 'Previously disclosed vulnerability; see the advisory for source and analyst attribution. Vettalon performed detection only.' },
    detection: { mode: 'focused', findingStatus: 'candidate', file: 'eval-stdin.php', line: 3, observedAt: '2026-10-12', claim: { zh: 'eval-stdin.php:3 將 php://input 送入 eval；若檔案可由 HTTP 存取，請求內容可能被當成 PHP 執行。', en: 'eval-stdin.php:3 passes php://input to eval. HTTP accessibility could expose execution of request-supplied PHP.' }, reviewerConclusion: { zh: 'codex：no_verdict。模型呼叫失敗，沒有完成有效覆核，最終保留 candidate。', en: 'codex: no_verdict. A model invocation failed; no valid review verdict was recorded, leaving a candidate.' }, finder: 'claude (Anthropic alias)', reviewer: 'codex (OpenAI alias): no_verdict', toolVersion: 'Not recorded in historical report (schema v2)', modelVersions: 'Exact model versions not recorded; aliases only', scope: 'Single file: eval-stdin.php; focused deep AI review; no truncation recorded', rerun: 'git clone --branch 5.6.2 --depth 1 https://github.com/sebastianbergmann/phpunit.git phpunit-case\nmkdir -p phpunit-focused\ncp phpunit-case/src/Util/PHP/eval-stdin.php phpunit-focused/\nvettalon scan ./phpunit-focused --profile deep --config ./config.toml --max-modules 8 --cross-check-top 8 --report ./phpunit-result.json --no-prior', sha256: '0949c8ab616480fb25c5c781f03f98a0eb8262363239fda7a1f8db3f77131e7b' },
    dossier: {"artifactPath": "/evidence/dossiers/phpunit-cve-2017-9841.json", "sha256": "05cf2431070873402b901cea2e0461be58cd2a133dc52dfce9769a1942189055", "runStatus": "incomplete", "incompleteReason": "units_failed"},
    timeline: [{ date: '2017-06-27', event: { zh: 'NVD 發布紀錄', en: 'NVD publication date' } },{ date: '2026-10-12', event: { zh: '聚焦識別測試，候選未確認', en: 'Focused detection; unconfirmed candidate' } },{ date: '2026-10-16', event: { zh: '公開來源與紀錄邊界核對', en: 'Public sources and evidence boundary reviewed' } }],
  },
  {
    id: 'ammonia-ghsa-x43w-36pp-96g3', publication: 'public', reviewedAt: '2026-10-18', type: 'reported', status: 'regression-verified', package: 'ammonia', ecosystem: 'Cargo',
    title: { zh: 'CSS URL 大小寫處理缺口', en: 'Case-sensitive CSS URL filtering gap' },
    summary: { zh: '上游公告指出，特定 CSS 清理設定未對大寫 URL() 套用預期的網址政策，可能讓追蹤圖片通過；公告明確說明不構成 XSS。', en: 'The upstream advisory says uppercase URL() can bypass configured CSS URL filtering and permit tracking pixels in some settings; it explicitly says this is not XSS.' },
    cve: null, ghsa: 'GHSA-x43w-36pp-96g3', cwe: null, rustsecId: 'RUSTSEC-2026-0373',
    sourceVersion: '4.2.3', fixedVersion: '4.2.4',
    sourceUrl: 'https://github.com/rust-ammonia/ammonia/blob/v4.2.3/src/style.rs',
    advisoryUrl: 'https://github.com/rust-ammonia/ammonia/security/advisories/GHSA-x43w-36pp-96g3',
    fixUrl: 'https://github.com/rust-ammonia/ammonia/pull/267',
    upstreamCreditUrl: 'https://rustsec.org/advisories/RUSTSEC-2026-0373.html',
    publishedAt: '2026-10-17',
    boundary: { zh: 'Louis Li 獲 RustSec 列為通報者。獨立的函式庫政策回歸測試在 4.2.3 為 3／5 通過、4.2.4 為 5／5 通過；這是通報與修補版驗證，並非產品掃描自動發現。', en: 'RustSec credits Louis Li as reporter. Isolated library policy regression tests passed 3/5 on 4.2.3 and 5/5 on 4.2.4. This is a reported issue with fixed-version validation, not automated discovery by the product scanner.' },
    method: { zh: '在隔離、離線環境中，對 4.2.3 與官方 4.2.4 套用相同的五種 caller-policy 測試、七組輸入。逐項結果與六行測試輸出節錄見公開 JSON；完整原始 log 未公開。', en: 'The same five caller-policy methods and seven inputs were tested against 4.2.3 and the official 4.2.4 crate in isolated offline runs. Per-check results and six-line test-output excerpts are in the public JSON; complete original logs are not published.' },
    limitations: { zh: '未測瀏覽器實際載入、應用整合、Vettalon 掃描流程、4.1.8 或全部受影響版本。GHSA 未指派 CVE 或 CWE；六行節錄不能取代完整原始 log。', en: 'No browser loading, application integration, Vettalon scan flow, 4.1.8, or all affected versions were tested. The GHSA has no assigned CVE or CWE. Six-line excerpts do not replace complete original logs.' },
    credit: { zh: 'RustSec 公開紀錄列 Louis Li 為通報者；修補與公告由 ammonia 上游維護者處理。Vettalon 僅公開此通報與範圍有限的回歸驗證，不宣稱自動找到原始漏洞。', en: 'RustSec publicly names Louis Li as the reporter; ammonia maintainers handled the fix and advisory. Vettalon publishes the report and scoped regression validation, without claiming automated discovery of the original issue.' },
    regression: {
      artifactPath: '/evidence/regressions/ammonia-ghsa-x43w-36pp-96g3.json', sha256: '8408ec473378449869e6a08a8eb9d36466393aac41fe7b8e4915f772ec2c7c5f', testedAt: '2026-10-18',
      checks: [
        { id: 'http_lower', role: 'denied-policy', vulnerable: 'ok', fixed: 'ok' },
        { id: 'http_upper', role: 'denied-policy', vulnerable: 'failed', fixed: 'ok' },
        { id: 'https_control', role: 'allowed-control', vulnerable: 'ok', fixed: 'ok' },
        { id: 'relative_lower', role: 'denied-policy', vulnerable: 'ok', fixed: 'ok' },
        { id: 'relative_mixed', role: 'denied-policy', vulnerable: 'failed', fixed: 'ok' },
      ],
    },
    timeline: [
      { date: '2026-10-16', event: { zh: 'RustSec 記錄通報日期', en: 'Reported date in RustSec' } },
      { date: '2026-10-17', event: { zh: 'GHSA／RustSec 公告與修補版本公開', en: 'GHSA/RustSec advisories and patched releases published' } },
      { date: '2026-10-18', event: { zh: '4.2.3 與 4.2.4 固定政策案例重新測試，整理公開摘要', en: 'Fixed policy cases rerun on 4.2.3 and 4.2.4; public summary curated' } },
    ],
  },
];
export const cases = validateManifest(reviewed);
