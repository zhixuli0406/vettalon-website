// Historical detection benchmark, 2026-10-20: five already disclosed and patched
// advisories, scanned as official release archives (vulnerable + fixed) under
// match criteria registered before the first scan. Curated public fields only.

const RUN_AT = '2026-10-20';
const REVIEWED_AT = '2026-10-20';
const TOOL = 'vettalon 0.3.0 (built from source on 2026-10-20)';
const MODELS = 'Finder claude-opus-5-5 (claude CLI 2.1.300); verifiers grok-4.7 (grok CLI 1.0.62) and gpt-oss-120b-medium (agy 1.4.3)';
const SCOPE = 'Whole release archive, no git history; up to 8 audit units; changelog files removed from both arms; L0 (no CWE, location or advisory hint)';
const FLAGS = '--profile deep --config ./config.toml --finders claude --verifiers grok,agy --max-modules 8 --refuter-runs 1 --no-prior --time-budget 2400 --report';
const dir = '/evidence/benchmarks/historical-detection-20261020';

const method = {
  zh: '從官方套件庫下載脆弱版與修補版的發布封存檔，核對 SHA-256 後掃描整個樹，沒有 git 歷史。兩版用同一組參數：deep profile、claude 找洞、grok 與 agy（GPT-OSS）跨家族覆核、最多 8 個審查單元、每個候選覆核 1 次、PoC 關閉。模型輸入不含 CVE 編號、公告文字或修補 diff，兩版都先移除 changelog。比對標準（檔案、行號範圍、CWE 清單）在 2026-10-20 12:51 UTC 公開提交，第一次掃描在 29 秒後開始。登錄檔內的 registeredAt 寫 12:55，是提交前手填的估計，與實際不符；以提交時間為準，檔案沒有再改，所以雜湊不變。',
  en: 'Official release archives of the vulnerable and fixed versions were downloaded from the package registry, checked against SHA-256 and scanned as whole trees without git history. Both arms used the same parameters: deep profile, claude as finder, grok and agy (GPT-OSS) as cross-family verifiers, at most 8 audit units, one verifier run per candidate, PoC off. Model input contained no CVE id, advisory text or fix diff, and changelog files were removed from both arms. Match criteria (file, line ranges, CWE list) were committed publicly at 12:51 UTC on 2026-10-20; the first scan started 29 seconds later. The registeredAt field inside the file says 12:55; it was a hand-typed estimate made before the commit and is wrong. The commit time is authoritative, and the file was left unchanged so its digest still matches.',
};
const limitationsBase = {
  zh: '模型可能在訓練時看過這份公告或修補，所以命中不能證明它是從程式碼推理出來的。候選與 needs_human 都不是自動確認，這次也沒有跑 PoC 或任何利用。單次執行，模型輸出有隨機性。五筆案例是挑過的已知漏洞，不能拿來推估召回率或誤報率。其他輸出只公開數量，沒有審閱。原始 report.json 與 trace 不公開，只列 SHA-256。表格的執行狀態照錄產品回報；incomplete 代表有單元延後、截斷、失敗或沒能交叉核對，原因列在旁邊，但每一臂的目標檔都有送審。修補版「未被標記」只表示對應範圍沒有符合 CWE 清單、且沒被駁回的輸出，同一臂的其他輸出沒有審閱，不能當成修補版沒有其他問題。',
  en: 'The models may have seen this advisory or its fix during training, so a match does not show that they reasoned it out from the code. Candidates and needs_human results are not automatic confirmation, and no PoC or exploit was run. This was a single run and model output is nondeterministic. Five hand-picked known issues cannot support a recall or false-positive rate. Other output is published as counts only and was not reviewed. The raw report.json and trace are not public; only their SHA-256 is listed. The run status in the table is what the product reported: incomplete means some unit was deferred, truncated, failed or could not be cross-checked, with the reason shown, but the target file was sent for review in every arm. On the fixed release, "not flagged" only means no unrefuted output in the corresponding range carried a listed CWE; the other output in that arm was not reviewed and says nothing about the fixed release being free of other issues.',
};
// AI-use statement for the human review block; cases.js appends the shared drafting note.
export const benchmarkAiUse = {
  zh: '找洞與覆核由 AI 模型執行（找洞為 claude-opus-5-5，覆核為 grok-4.7 與 agy 上的 gpt-oss-120b-medium），結論停在 needs_human 或 candidate，AI 判定不視為確認。比對標準在第一次掃描前登錄。',
  en: 'Finding and verification were run by AI models (finder claude-opus-5-5; verifiers grok-4.7 and gpt-oss-120b-medium via agy). Results stop at needs_human or candidate; an AI verdict is not treated as confirmation. Match criteria were registered in advance.',
};

function archiveCase({ id, rerunUrl, rerunSha256, rerunStrip = 1, limitations, credit, timeline, benchmark, detection, ...rest }) {
  return {
    id, publication: 'public', reviewedAt: REVIEWED_AT, type: 'historical', status: 'detected', ...rest,
    method,
    limitations: { zh: `${limitationsBase.zh}${limitations?.zh ?? ''}`, en: `${limitationsBase.en}${limitations?.en ? ' ' + limitations.en : ''}` },
    credit: { zh: `${credit.zh}Vettalon 只做已知漏洞的識別測試。`, en: `${credit.en} Vettalon performed detection of a known issue only.` },
    timeline: [...timeline, { date: RUN_AT, event: { zh: '公開登錄比對標準後，掃描脆弱版與修補版封存檔', en: 'Match criteria registered publicly; vulnerable and fixed release archives scanned' } }],
    detection: {
      mode: 'release-archive', observedAt: RUN_AT, finder: 'claude-opus-5-5 (Anthropic)', toolVersion: TOOL, modelVersions: MODELS, scope: SCOPE,
      rerun: `curl -sSfLo release-archive ${rerunUrl}\nshasum -a 256 release-archive   # expect ${rerunSha256}\nmkdir release-tree && bsdtar -xf release-archive --strip-components ${rerunStrip} -C release-tree\n# remove the files listed under "excluded" in the pre-registration, then:\nvettalon scan ./release-tree ${FLAGS} ./result.json`,
      ...detection,
    },
    benchmark: { artifactPath: `${dir}/${id}.json`, runAt: RUN_AT, ...benchmark },
  };
}

export const benchmarkCases = [
  archiveCase({
    id: 'minimist-cve-2021-44906', package: 'minimist', ecosystem: 'npm',
    title: { zh: '參數解析的原型污染', en: 'Prototype pollution in argument parsing' },
    summary: { zh: 'setKey 只擋 __proto__，沒擋 constructor.prototype，命令列參數可以改寫 Object 原型上的屬性。', en: 'setKey blocks __proto__ but not constructor.prototype, so command-line arguments can write properties onto object prototypes.' },
    cve: 'CVE-2021-44906', ghsa: 'GHSA-xvch-5gv4-984h', cwe: 'CWE-1321', sourceVersion: '1.2.5', fixedVersion: '1.2.6',
    sourceUrl: 'https://github.com/minimistjs/minimist/blob/v1.2.5/index.js',
    advisoryUrl: 'https://github.com/advisories/GHSA-xvch-5gv4-984h',
    fixUrl: 'https://github.com/minimistjs/minimist/commit/c2b981977fa834b223b408cfb860f933c9811e4d', publishedAt: '2022-03-17',
    boundary: { zh: '1.2.5 封存檔掃描在 index.js:75（setKey）提出 CWE-1321 候選，grok 覆核判 plausible，最後是 needs_human，符合預先登錄的位置與 CWE。修補版 1.2.6 用同一組參數掃描，對應範圍沒有符合 CWE 清單的輸出。', en: 'The 1.2.5 archive scan raised a CWE-1321 candidate at index.js:75 (setKey); grok judged it plausible and it ended as needs_human, meeting the registered location and CWE. The fixed 1.2.6 scan with the same parameters produced nothing in the corresponding range with a listed CWE.' },
    credit: { zh: '原始通報與修補歸屬見 GHSA 公告與 minimist 上游。', en: 'Original report and fix credits belong to the GHSA advisory and the minimist maintainers.' },
    timeline: [{ date: '2022-03-17', event: { zh: 'NVD 發布紀錄', en: 'NVD publication date' } }],
    detection: { findingStatus: 'needs_human', file: 'index.js', line: 75, sha256: '1e3b6711cd6922ef6bb78ba791037bebe16a5a7db967aeefcae4e45594a434d0',
      claim: { zh: 'setKey 的原型污染防護不完整，可經 constructor.constructor.prototype 污染 Function.prototype。', en: 'The prototype-pollution guard in setKey is incomplete; Function.prototype can be polluted through constructor.constructor.prototype.' },
      reviewerConclusion: { zh: 'grok：plausible。覆核沒有駁倒候選，結論停在 needs_human，不算確認。', en: 'grok: plausible. The verifier did not refute the candidate; it remains needs_human and is not a confirmation.' },
      reviewer: 'grok-4.7 (xAI): plausible' },
    rerunUrl: 'https://registry.npmjs.org/minimist/-/minimist-1.2.5.tgz', rerunSha256: 'a1800ce4d39356e96497bd09a41fad0033a13dd8eeb469008333547505ce4350', rerunStrip: 1,
    benchmark: { sha256: '07a665782cd8fcc2273fa8041d7d721c8154c389877e897cc710090e51a931e2', vulnerable: { outcome: 'found', calls: 5, runStatus: 'complete', incompleteReason: null, targetReviewed: true }, fixed: { outcome: 'notFlagged', calls: 3, runStatus: 'complete', incompleteReason: null, targetReviewed: true } },
  }),
  archiveCase({
    id: 'pyjwt-cve-2022-29217', package: 'PyJWT', ecosystem: 'PyPI',
    title: { zh: 'HMAC 金鑰黑名單漏掉的公鑰格式', en: 'Public key formats missing from the HMAC key blocklist' },
    summary: { zh: 'HMAC 演算法只擋部分公鑰字串，ssh-ed25519 等 OpenSSH 公鑰可被當成 HMAC 密鑰，攻擊者可用公開的公鑰簽出被接受的 token。', en: 'The HMAC algorithm blocks only some public-key strings, so OpenSSH keys such as ssh-ed25519 can be used as an HMAC secret and an attacker can sign accepted tokens with the public key.' },
    cve: 'CVE-2022-29217', ghsa: 'GHSA-ffqj-6fqr-9h24', cwe: 'CWE-327', sourceVersion: '2.3.0', fixedVersion: '2.4.0',
    sourceUrl: 'https://github.com/jpadilla/pyjwt/blob/2.3.0/jwt/algorithms.py',
    advisoryUrl: 'https://github.com/jpadilla/pyjwt/security/advisories/GHSA-ffqj-6fqr-9h24',
    fixUrl: 'https://github.com/jpadilla/pyjwt/commit/9c528670c455b8d948aff95ed50e22940d1ad3fc', publishedAt: '2022-05-12',
    boundary: { zh: '2.3.0 封存檔掃描在 jwt/algorithms.py:193（HMACAlgorithm.prepare_key）提出 CWE-327 候選，grok 判 plausible，最後是 needs_human，符合預先登錄的標準。修補版 2.4.0 同參數掃描，對應範圍沒有符合 CWE 清單的輸出。', en: 'The 2.3.0 archive scan raised a CWE-327 candidate at jwt/algorithms.py:193 (HMACAlgorithm.prepare_key); grok judged it plausible and it ended as needs_human, meeting the registered criteria. The fixed 2.4.0 scan with the same parameters produced nothing in the corresponding range with a listed CWE.' },
    limitations: { zh: '2.4.0 封存檔內以公告編號命名的回歸測試 tests/test_advisory.py 在掃描前移除；2.3.0 沒有這個檔案。', en: 'The 2.4.0 archive ships a regression test named after the advisory (tests/test_advisory.py); it was removed before scanning. 2.3.0 has no such file.' },
    credit: { zh: '公告寫明由 Aapo Oksman（Nixu）揭露；修補歸屬見 PyJWT 公告。', en: 'The advisory credits Aapo Oksman (Nixu) with the disclosure; see the PyJWT advisory for fix credits.' },
    timeline: [{ date: '2022-05-12', event: { zh: 'PyJWT 公告與 2.4.0 修補公開', en: 'PyJWT advisory and 2.4.0 fix published' } }],
    detection: { findingStatus: 'needs_human', file: 'jwt/algorithms.py', line: 193, sha256: '81fb9120cbb14c416b5ec50f84185a4bae09ff7478d72b51cb2e769ac34baf94',
      claim: { zh: 'HMAC 金鑰黑名單漏掉 OpenSSH 的 EC／EdDSA 公鑰，可造成 HS256 演算法混淆。', en: 'The HMAC key blocklist misses OpenSSH EC/EdDSA public keys, allowing HS256 algorithm confusion.' },
      reviewerConclusion: { zh: 'grok：plausible。覆核沒有駁倒候選，結論停在 needs_human，不算確認。', en: 'grok: plausible. The verifier did not refute the candidate; it remains needs_human and is not a confirmation.' },
      reviewer: 'grok-4.7 (xAI): plausible' },
    rerunUrl: 'https://files.pythonhosted.org/packages/1d/8e/01bdcfdbb352daaba8ea406d9df149c5bba7dbf70f908d4fa4c269fe6a08/PyJWT-2.3.0.tar.gz', rerunSha256: 'b888b4d56f06f6dcd777210c334e69c737be74755d3e5e9ee3fe67dc18a0ee41', rerunStrip: 1,
    benchmark: { sha256: 'cf7636c10081000a50f1f26a7d76c5b29d369e8289f8c8f675ac31f709bc1f08', vulnerable: { outcome: 'found', calls: 10, runStatus: 'incomplete', incompleteReason: 'injection_uncrosschecked', targetReviewed: true }, fixed: { outcome: 'notFlagged', calls: 10, runStatus: 'incomplete', incompleteReason: 'injection_uncrosschecked', targetReviewed: true } },
  }),
  archiveCase({
    id: 'guzzle-psr7-cve-2022-24775', package: 'guzzlehttp/psr7', ecosystem: 'Packagist',
    title: { zh: 'HTTP 標頭值缺少 CR／LF 檢查', en: 'Header values not checked for CR/LF' },
    summary: { zh: '標頭值只去頭尾空白，沒有拒絕 \\r 與 \\n，不受信任的值可以夾帶額外標頭。', en: 'Header values are only trimmed and never rejected for \\r or \\n, so untrusted values can smuggle extra headers.' },
    cve: 'CVE-2022-24775', ghsa: 'GHSA-q7rv-6hp3-vh96', cwe: 'CWE-20', sourceVersion: '2.1.0', fixedVersion: '2.1.1',
    sourceUrl: 'https://github.com/guzzle/psr7/blob/2.1.0/src/MessageTrait.php',
    advisoryUrl: 'https://github.com/guzzle/psr7/security/advisories/GHSA-q7rv-6hp3-vh96',
    fixUrl: 'https://github.com/guzzle/psr7/commit/e55afaa3fc138c89adf3b55a8ba20dc60d17f1f1', publishedAt: '2022-03-20',
    boundary: { zh: '2.1.0 封存檔掃描在 src/MessageTrait.php:208（trimHeaderValues）提出 CWE-113 候選，grok 判 plausible，最後是 needs_human，符合預先登錄的位置與 CWE 清單。修補版 2.1.1 同參數掃描，對應範圍沒有符合 CWE 清單的輸出。', en: 'The 2.1.0 archive scan raised a CWE-113 candidate at src/MessageTrait.php:208 (trimHeaderValues); grok judged it plausible and it ended as needs_human, meeting the registered location and CWE list. The fixed 2.1.1 scan with the same parameters produced nothing in the corresponding range with a listed CWE.' },
    limitations: { zh: 'Packagist 的發布檔是 GitHub 依 commit 產生的 zipball，位元組可能隨 GitHub 打包方式變動；本頁釘選的是 2026-10-20 下載到的 SHA-256。', en: 'The Packagist dist is a GitHub zipball generated from a commit, and its bytes can change with GitHub archiving; the SHA-256 pinned here is the one downloaded on 2026-10-20.' },
    credit: { zh: '原始通報與修補歸屬見 guzzle/psr7 公告。', en: 'Original report and fix credits belong to the guzzle/psr7 advisory.' },
    timeline: [{ date: '2022-03-20', event: { zh: 'guzzle/psr7 公告與 2.1.1 修補公開', en: 'guzzle/psr7 advisory and 2.1.1 fix published' } }],
    detection: { findingStatus: 'needs_human', file: 'src/MessageTrait.php', line: 208, sha256: 'f9e27d8a28fbf48edebe0cfe1236d6b8fe00dd4234d685fa17a22da9b9625715',
      claim: { zh: '標頭值從未檢查 CR／LF，攻擊者可注入標頭或切分請求。', en: 'Header values are never checked for CR/LF, so attackers can inject headers or split requests.' },
      reviewerConclusion: { zh: 'grok：plausible。覆核沒有駁倒候選，結論停在 needs_human，不算確認。', en: 'grok: plausible. The verifier did not refute the candidate; it remains needs_human and is not a confirmation.' },
      reviewer: 'grok-4.7 (xAI): plausible' },
    rerunUrl: 'https://api.github.com/repos/guzzle/psr7/zipball/089edd38f5b8abba6cb01567c2a8aaa47cec4c72', rerunSha256: '2b0b4998cf069344114189d7ad994960e86131b96c31c19716c86581ba7a49cc', rerunStrip: 1,
    benchmark: { sha256: '33b0e37f2761def83e42c7a1af25ac672b053671fe4b01aec7e013bb41135f59', vulnerable: { outcome: 'found', calls: 11, runStatus: 'incomplete', incompleteReason: 'scope_not_fully_reviewed', targetReviewed: true }, fixed: { outcome: 'notFlagged', calls: 9, runStatus: 'incomplete', incompleteReason: 'scope_not_fully_reviewed', targetReviewed: true } },
  }),
  archiveCase({
    id: 'gorilla-websocket-cve-2020-27813', package: 'github.com/gorilla/websocket', ecosystem: 'Go',
    title: { zh: '訊框長度整數溢位繞過讀取上限', en: 'Frame length integer overflow bypasses the read limit' },
    summary: { zh: '64 位元訊框長度轉成有號整數後可能變負數，讓 SetReadLimit 的檢查失效，伺服器可能被耗盡記憶體。', en: 'A 64-bit frame length converted to a signed integer can turn negative and defeat the SetReadLimit check, letting a peer exhaust server memory.' },
    cve: 'CVE-2020-27813', ghsa: 'GHSA-3xh2-74w9-5vxm', cwe: 'CWE-190', sourceVersion: 'v1.4.0', fixedVersion: 'v1.4.1',
    sourceUrl: 'https://github.com/gorilla/websocket/blob/v1.4.0/conn.go',
    advisoryUrl: 'https://github.com/advisories/GHSA-3xh2-74w9-5vxm',
    fixUrl: 'https://github.com/gorilla/websocket/commit/5b740c29263eb386f33f265561c8262522f19d37', publishedAt: '2019-08-25',
    boundary: { zh: 'v1.4.0 封存檔掃描在 conn.go:843（advanceFrame 的 64 位元長度）提出 CWE-190 候選，符合預先登錄的標準。grok 覆核在 600 秒逾時，沒有判定，所以狀態停在 candidate。修補版 v1.4.1 同參數掃描，對應範圍沒有符合 CWE 清單的輸出。', en: 'The v1.4.0 archive scan raised a CWE-190 candidate at conn.go:843 (the 64-bit length in advanceFrame), meeting the registered criteria. The grok verifier timed out after 600 seconds with no verdict, so the status stayed candidate. The fixed v1.4.1 scan with the same parameters produced nothing in the corresponding range with a listed CWE.' },
    limitations: { zh: '這筆候選沒有完成跨家族覆核（逾時），比其他四筆少一層檢查。', en: 'This candidate has no completed cross-family review (timeout), one check fewer than the other four.' },
    credit: { zh: '公告寫明由 Max Justicz 發現並通報；修補歸屬見 gorilla/websocket 公告。', en: 'The advisory credits Max Justicz with discovering and reporting the issue; see the gorilla/websocket advisory for fix credits.' },
    timeline: [{ date: '2019-08-25', event: { zh: 'gorilla/websocket 儲存庫公告發布', en: 'gorilla/websocket repository advisory published' } }],
    detection: { findingStatus: 'candidate', file: 'conn.go', line: 843, sha256: 'a75bb0c859555fe2e77114a6ac9278b41d96643fe736b01b36cce6b57869a421',
      claim: { zh: '64 位元訊框長度的有號溢位可繞過 SetReadLimit，造成記憶體無上限消耗。', en: 'Signed overflow of the 64-bit frame length bypasses SetReadLimit, allowing unbounded memory consumption.' },
      reviewerConclusion: { zh: 'grok：no_verdict。覆核呼叫 600 秒逾時，沒有有效判定，結論停在 candidate。', en: 'grok: no_verdict. The verifier call timed out after 600 seconds with no valid verdict, leaving a candidate.' },
      reviewer: 'grok-4.7 (xAI): no_verdict (timeout)' },
    rerunUrl: 'https://proxy.golang.org/github.com/gorilla/websocket/@v/v1.4.0.zip', rerunSha256: '937dac399bca2f88344c31ee295cd57310244bc1a3a58e8bcb14ab26a6009d0e', rerunStrip: 3,
    benchmark: { sha256: 'a6bdc3216215625191bdc9ba4d51b0a7f35e9401492d64364130dce857507c24', vulnerable: { outcome: 'found', calls: 11, runStatus: 'incomplete', incompleteReason: 'units_failed', targetReviewed: true }, fixed: { outcome: 'notFlagged', calls: 12, runStatus: 'incomplete', incompleteReason: 'scope_not_fully_reviewed', targetReviewed: true } },
  }),
  archiveCase({
    id: 'smallvec-cve-2021-25900', package: 'smallvec', ecosystem: 'Cargo',
    title: { zh: 'insert_many 的緩衝區溢位', en: 'Buffer overflow in insert_many' },
    summary: { zh: 'iterator 實際給出的元素比 size_hint 下限多時，insert_many 會寫出配置範圍外，造成堆積記憶體損毀。', en: 'When an iterator yields more items than its size_hint lower bound, insert_many writes past the allocated buffer and corrupts heap memory.' },
    cve: 'CVE-2021-25900', ghsa: 'GHSA-43w2-9j62-hq99', cwe: 'CWE-787', sourceVersion: '1.6.0', fixedVersion: '1.6.1',
    sourceUrl: 'https://github.com/servo/rust-smallvec/blob/v1.6.0/src/lib.rs',
    advisoryUrl: 'https://github.com/advisories/GHSA-43w2-9j62-hq99',
    fixUrl: 'https://github.com/servo/rust-smallvec/commit/9998ba0694a6b51aa6604748b00b6a98f0a0039e', publishedAt: '2021-01-08',
    boundary: { zh: '1.6.0 封存檔掃描在 src/lib.rs:1044（insert_many）提出 CWE-787 候選，grok 判 plausible，最後是 needs_human，符合預先登錄的標準。修補版 1.6.1 同參數掃描，對應範圍沒有符合 CWE 清單的輸出。', en: 'The 1.6.0 archive scan raised a CWE-787 candidate at src/lib.rs:1044 (insert_many); grok judged it plausible and it ended as needs_human, meeting the registered criteria. The fixed 1.6.1 scan with the same parameters produced nothing in the corresponding range with a listed CWE.' },
    limitations: { zh: 'src/lib.rs 有 1,981 行，超過單一審查單元的長度，兩版都只送出第 1–1500 行；目標範圍在送出的部分之內。修補版的該單元標為 partially_reviewed。', en: 'src/lib.rs has 1,981 lines, more than one audit unit holds, so both arms sent lines 1-1500 only; the target range is inside that part. On the fixed arm that unit is marked partially_reviewed.' },
    credit: { zh: 'RustSec 公告寫明由 Yechan Bae（@Qwaz）與 Georgia Tech SSLab 的 Rust 小組發現並通報；修補歸屬見 smallvec 上游。', en: 'The RustSec advisory credits Yechan Bae (@Qwaz) and the Rust group at Georgia Tech SSLab with finding and reporting it; see the smallvec maintainers for fix credits.' },
    timeline: [{ date: '2021-01-08', event: { zh: 'RustSec 公告與 1.6.1 修補', en: 'RustSec advisory and 1.6.1 fix' } }],
    detection: { findingStatus: 'needs_human', file: 'src/lib.rs', line: 1044, sha256: '9849a3cc419303d1f92ed11810582931d29cfe064ef6a17dbcaa1f970d8b817b',
      claim: { zh: 'iterator 給出的元素多於 size_hint 下限時，insert_many 發生堆積／堆疊緩衝區溢位。', en: 'insert_many overflows its heap or inline buffer when the iterator yields more items than its size_hint lower bound.' },
      reviewerConclusion: { zh: 'grok：plausible。覆核沒有駁倒候選，結論停在 needs_human，不算確認。', en: 'grok: plausible. The verifier did not refute the candidate; it remains needs_human and is not a confirmation.' },
      reviewer: 'grok-4.7 (xAI): plausible' },
    rerunUrl: 'https://static.crates.io/crates/smallvec/smallvec-1.6.0.crate', rerunSha256: '1a55ca5f3b68e41c979bf8c46a6f1da892ca4db8f94023ce0bd32407573b1ac0', rerunStrip: 1,
    benchmark: { sha256: 'eac6e7a1514df2718223aeef3d4a6a3d58aa82aba6967b9bc52b66dfe86f84d4', vulnerable: { outcome: 'found', calls: 7, runStatus: 'incomplete', incompleteReason: 'scope_not_fully_reviewed', targetReviewed: true }, fixed: { outcome: 'notFlagged', calls: 6, runStatus: 'incomplete', incompleteReason: 'scope_not_fully_reviewed', targetReviewed: true } },
  }),
];
