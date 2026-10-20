# 公開案例維護指南

證據牆目前發布三筆紀錄：aiohttp 與 PHPUnit 是歷史漏洞的聚焦識別測試；aiohttp 另有後來獨立完成的官方雙版本本地 HTTP 四格對照；Ammonia 是 Vettalon 獵捕提出候選並產生草稿，經人工重現與送件、上游修補後再做限定回歸的原創發現。兩筆歷史紀錄保留原報告的 `needs_human`／`candidate` 狀態；Ammonia 原候選也是 `needs_human`，不把當時的候選輸出冒稱自動確認。尚未公開的協調揭露案件不列入本站。

首頁案例卡的識別碼、類型與「公開案例／歷史識別／原創發現」集合數由同一份公開 manifest 產生；中英文卡片說明仍需逐案人工編輯。首頁計數只是證據牆公開紀錄的集合大小，不能當成掃描母體、召回率或誤報率的分母。新增公開案例時，兩種語言都必須有對應卡片，否則建置會失敗。證據牆列表上方的政策說明（幾筆歷史識別、幾筆原創發現、幾筆上游通報）也由 manifest 計數產生（`src/evidence/policy.js`）。

## 人工審閱者與 AI 使用聲明

每筆案例可帶 `review` 欄：`{ reviewer, reviewedAt, aiUse: { zh, en } }`。案例頁側欄顯示「人工審閱：zhixuli0406（審閱日期）」與該案的 AI 使用說明。審閱者化名集中在 `src/evidence/cases.js` 的 `PUBLIC_REVIEWER` 常數，要換化名只改這一處；schema 只接受 GitHub 帳號格式（英數與單一連字號，最長 39 字元），拒絕 email、空白或真名式的自由文字。`review.reviewedAt` 必須等於案例的 `reviewedAt`，`cases.js` 用 `humanReview()` 從同一個日期帶入，不另外填審閱日期。`aiUse` 只寫紀錄中查得到的事：哪一段由 AI 模型執行、AI 判定停在哪個狀態、哪一段由人完成，以及紀錄文字由 AI 程式助理協助整理、經人工核對後發布。`review` 是選填欄位，沒有這欄的案例不顯示審閱行，通報漏斗也會把它算成「含未審閱紀錄」。

## 通報漏斗

`/evidence/` 與 `/en/evidence/` 列表下方有通報漏斗，依案例類型（原創發現、上游通報、歷史漏洞）各列 n 與四個階段：已通報上游 → 維護者確認收到 → 修補版本釋出 → 公告／CVE 公開。計算在 `src/evidence/funnel.js`，只讀結構化欄位：

- 已通報上游、維護者確認收到：讀 `disclosure.reportedAt` 與 `disclosure.acknowledgement`。歷史案例不是 Vettalon 通報的，這兩段標「不適用」；非歷史案例沒有 `disclosure` 時標「—」。
- 修補版本釋出：每筆案例都有必填的 `fixedVersion`，日期讀 `disclosure.fixedReleaseAt`，沒有就顯示「—」。
- 公告／CVE 公開：讀 `publishedAt`。

`disclosure` 只允許出現在 `discovery`／`reported` 類型，`reported` 類型必填。它的每個日期都必須是該案時間軸上已有的日期，`reportedAt` 不得晚於 `publishedAt`，確認與修補日期不得早於通報日期；維護者確認的日期查不到時填 `null`，但仍要附公開連結（Ammonia 是修補 PR #267）。漏斗不從內文推算數字，也不補日期。樣本少於 10 筆時只列筆數，不換算比例；達到 10 筆後才顯示 Wilson 95% 區間，不顯示單點百分比。每格若所有案例都有 `review`，標「人工核對」。Vettalon 自動輸出的候選與 `needs_human` 不計入漏斗。

## 逐案驗證設定（case profiles）

回歸摘要、產品輸出節錄與雙版本證據包的固定預期值，放在 `src/evidence/schema.js` 的 `caseProfiles`，以案例 ID 為鍵。Ammonia 的五項政策測試（ID、角色、脆弱版預期、測試名稱）、5 項測試／7 組輸入、兩版 exit code 與通過／失敗／filtered 計數、產品輸出的行雜湊、版本、位置、標題與草稿檔名，全部照原本的硬編碼值搬進它自己的 profile，檢查強度不變。帶 `regression`、`origin` 或 `pairedBundle` 的案例若在 `caseProfiles` 沒有對應 ID，validator 直接拒絕。之後新增第二筆上游通報案例時，要為該案 ID 加一組 profile，不能沿用 Ammonia 的預期值。測試可用 `validateManifest(input, { profiles })` 傳入測試專用 profile；正式建置一律用內建的 `caseProfiles`。

## 新增或修訂案例

公開清單只編輯 `src/evidence/cases.js`。不得匯入掃描目錄、私有報告、揭露追蹤表或未公開的上游 advisory。每筆須有可公開的來源、版本、方法、日期、歸屬、限制與中英文摘要；`publication` 必須為 `public`。`src/evidence/schema.js` 拒絕未知欄位、非公開狀態、不安全連結、重複 ID、私有本機路徑與不一致的驗證狀態。

列表直接標出每案可核對的材料類型；詳頁首屏按「產品觀測 → 人工／上游歸屬 → 修補對照 → 未驗證範圍」呈現導覽鏈。這是材料目錄，不是四項都已通過的流程圖。產品觀測只有 `origin` 候選與擬稿節錄，或 `dossier` 歷史 finding 節錄時才標為可核對，並連向對應附件；僅有 `detection` 摘要、`regression` 或 `reproduction` 的 schema 合法案例仍明示「未提供可核對的產品輸出」。人工整理的公開紀錄另列連結，不作為產品觀測證據。歸屬連上游公開 credit 或 advisory；修補對照在有 `regression`／`reproduction` 時連對應附件；aiohttp 則連到其另行執行的雙版本原始 HTTP 證據 ZIP。只有 `fixUrl` 而沒有對照測試時，明示「未提供修補版對照」，修補連結僅供查閱上游變更。最後一段連向逐案限制，不能由頁面導覽推論已驗證完整產品或全部受影響版本。`origin`、`dossier`、`regression` 等欄位及附件仍由原有 schema／建置閘門約束；頁面不自行補造來源。

`source-reviewed` 只代表公開來源已核對；`detected` 要保留原 finding 的實際判定及來源位置，不能改寫成利用成功；`regression-verified` 要有同組脆弱版／修補版的逐項結果；`reproduced` 才能呈現差分重現，並需要公開附件、雜湊、脆弱效果、修補對照與正常控制。`type: discovery` 須有上游公開歸屬，並搭配差分重現或可核對的產品原始候選節錄與限定回歸。公告 URL 本身不足以證明產品發現。

aiohttp／PHPUnit 的 `public/evidence/dossiers/` 只保留逐欄挑選的單筆 finding 及有效覆核文字。原始掃描報告未公開，`detection.sha256` 是供持有原件者比對的雜湊；附件本身另有 SHA-256。PHPUnit 的 runtime error trace 省略且仍為 `no_verdict`；aiohttp 的 `plausible` 仍為 `needs_human`。公開 tag／行號只是參考，不能證明歷史原始碼位元組。

aiohttp 後來獨立執行的 `run-08` 用官方 PyPI 3.9.1／3.9.2 完整 sdist、固定依賴與 Docker image，在無網路容器內以 raw HTTP 請求測試無 symlink 的自造 fixture。`GET /../private_file` 在 3.9.1 回 200 與自造 37-byte marker，在 3.9.2 回 404 且無 marker；`GET /public.txt` 兩版均回 200 與相同的 37-byte 內容。可公開的自寫程式與 `run-08` 收據、四格 raw request／response 與 stdout／stderr 按白名單放在 `evidence-bundles/aiohttp-paired-20261019/`，形成固定 ZIP。上游套件與 Docker image 不隨 ZIP 發布；其版本、URL、大小與 SHA-256 在來源 manifest 中釘選。此配對不是原產品掃描、原創漏洞發現或任意遠端服務利用證據；官方公告對顯式 symlink 指向靜態根外仍有設定風險提醒。離線 verifier 只核對封存內容與收據一致，不能回頭見證 Docker 或套件下載。較早的 incomplete 執行留在開發紀錄，不納入公開 ZIP。

Ammonia 的 `public/evidence/origins/` 是從 2026-10-14 UTC（臺灣 10 月 15 日）歸檔的 Vettalon hunt 工具輸出中，逐欄選取此案例的候選位置、`needs_human` 判定、產生草稿及原始 JSONL 行雜湊；未公開其他候選。原完整 `hunt.json`、當時來源位元組及可公開寄件收據未找回；人工送件由使用者確認，Ammonia 維護者在修補 PR #267 公開確認收到 zhixuli0406 的 email，RustSec 列 Louis Li 為通報者。原始 email 與寄件系統收據未公開。此節錄只證產品輸出與擬稿紀錄，未單獨證明寄送或當時原始碼位元組。原始 JSONL 沒有公開，第三方也無法單靠行雜湊獨立重算這筆輸出。

`public/evidence/regressions/` 放五項固定函式庫政策測試摘要：4.2.3 為 3 過 2 失敗，官方 4.2.4 為 5 過 0 失敗。HTTPS 正常控制有三種大小寫輸入，因此合計七組輸入。第二輪 4.2.3 比較的外層控制器因額外指紋檢查回報失敗；保存的原始測試輸出及來源綁定，後經修正的唯讀驗證器核對，並未重跑目標。完整原始 log 不公開；JSON 含兩版各六行測試輸出節錄。這不代表瀏覽器實際載入、完整產品掃描流程、應用整合或所有受影響版本已驗證。

另有 2026-10-18 UTC 的**新封存雙版本輪**，不是前述控制器失敗輪或原始 Vettalon 獵捕。可公開的自寫材料按白名單放在 `evidence-bundles/ammonia-paired-20261019/`，由 `scripts/package-ammonia-evidence.py` 產生固定 ZIP 至 `public/evidence/bundles/ammonia-paired-20261019.zip`。ZIP 含兩版原始 stdout／stderr、收據、官方 tag 讀回、來源 manifest、相同 harness、runner、離線 verifier、測試及授權；不含上游 crate 原始碼或本機 pinned vendor payload。網站的 `pairedBundle` 欄固定路徑與 SHA-256；單跑 `npm run build` 會先對照白名單與來源、檢查 ZIP 成員路徑／類型／大小及敏感字串，再限時執行解壓後的離線 verifier，接著在建置前後檢查固定路徑與 ZIP SHA-256。重新打包後必須更新案例 manifest 中的 ZIP SHA-256。離線 verifier 僅證封存內部一致，不獨立見證當時 Docker 執行或下載回應，也不證原始獵捕、瀏覽器 XSS 或產品檢出率。

## 建置與人工驗收

```sh
npm run check
```

建置前 `package-aiohttp-evidence.py --check` 與 `validate-aiohttp-bundle.py` 核對精確 ZIP 成員、大小、位元組、敏感字串與解壓後的離線 verifier；Ammonia 有對應的獨立閘門。接著 `validate-evidence.mjs` 逐一核對 manifest 與公開附件的固定路徑、schema、大小、UTF-8 及 SHA-256；預渲染後再核對 dist 複本。`publication-text-gate.mjs` 掃描輸出文字資產，拒絕私有路徑或測試 sentinel。這些檢查證明所選資料與建置產物一致，不是可信執行簽章，也不能代替人工查核來源。上線前還需檢查中英文列表、搜尋、篩選、空狀態、逐案頁、附件下載、行動版、鍵盤操作、canonical／hreflang 與 sitemap。

`tests/evidence-render.test.mjs` 驗證三筆案例的證據類型、四段順序、實際附件與上游連結，以及 PHPUnit 沒有修補版對照的明示。`tests/evidence-review-funnel.test.mjs` 驗證審閱者欄位、`disclosure` 日期規則、以案例 ID 為鍵的 profile、漏斗計數與日期、n 少於 10 不顯示比例，以及建置輸出含漏斗與審閱行。人工瀏覽器驗收仍需在窄螢幕確認不橫向溢出、按 Tab 能走完所有連結，並開啟／下載附件確認部署後可達；SSR 的字串測試不代表上述行為已完成。

原報告節錄的瀏覽器預覽需點擊後才讀取；`load-dossier.js` 對同源固定附件設 5 秒總期限與 64 KiB 串流上限，驗證實際位元組 SHA-256、strict UTF-8、JSON 與 schema 後才顯示。成功預覽只代表公開附件與頁面摘要一致，不代表歷史執行、漏洞可利用性或原始報告真實性。
