# 公開案例維護指南

證據牆目前發布三筆紀錄：aiohttp 與 PHPUnit 是歷史漏洞的聚焦識別測試；Ammonia 是 Vettalon 獵捕提出候選並產生草稿，經人工重現與送件、上游修補後再做限定回歸的原創發現。兩筆歷史紀錄保留原報告的 `needs_human`／`candidate` 狀態；Ammonia 原候選也是 `needs_human`，不把當時的候選輸出冒稱自動確認。Bollard 的 advisory 仍未公開，不列入本站。

## 新增或修訂案例

公開清單只編輯 `src/evidence/cases.js`。不得匯入掃描目錄、私有報告、揭露追蹤表或未公開的上游 advisory。每筆須有可公開的來源、版本、方法、日期、歸屬、限制與中英文摘要；`publication` 必須為 `public`。`src/evidence/schema.js` 拒絕未知欄位、非公開狀態、不安全連結、重複 ID、私有本機路徑與不一致的驗證狀態。

列表直接標出每案可核對的材料類型；詳頁首屏按「產品觀測 → 人工／上游歸屬 → 修補對照 → 未驗證範圍」呈現導覽鏈。這是材料目錄，不是四項都已通過的流程圖。產品觀測只有 `origin` 候選與擬稿節錄，或 `dossier` 歷史 finding 節錄時才標為可核對，並連向對應附件；僅有 `detection` 摘要、`regression` 或 `reproduction` 的 schema 合法案例仍明示「未提供可核對的產品輸出」。人工整理的公開紀錄另列連結，不作為產品觀測證據。歸屬連上游公開 credit 或 advisory；修補對照只在有 `regression`／`reproduction` 時連對應附件。只有 `fixUrl` 而沒有對照測試時，明示「未提供修補版對照」，修補連結僅供查閱上游變更。最後一段連向逐案限制，不能由頁面導覽推論已驗證完整產品或全部受影響版本。`origin`、`dossier`、`regression` 等欄位及附件仍由原有 schema／建置閘門約束；頁面不自行補造來源。

`source-reviewed` 只代表公開來源已核對；`detected` 要保留原 finding 的實際判定及來源位置，不能改寫成利用成功；`regression-verified` 要有同組脆弱版／修補版的逐項結果；`reproduced` 才能呈現差分重現，並需要公開附件、雜湊、脆弱效果、修補對照與正常控制。`type: discovery` 須有上游公開歸屬，並搭配差分重現或可核對的產品原始候選節錄與限定回歸。公告 URL 本身不足以證明產品發現。

aiohttp／PHPUnit 的 `public/evidence/dossiers/` 只保留逐欄挑選的單筆 finding 及有效覆核文字。原始掃描報告未公開，`detection.sha256` 是供持有原件者比對的雜湊；附件本身另有 SHA-256。PHPUnit 的 runtime error trace 省略且仍為 `no_verdict`；aiohttp 的 `plausible` 仍為 `needs_human`。公開 tag／行號只是參考，不能證明歷史原始碼位元組。

Ammonia 的 `public/evidence/origins/` 是從 2026-10-14 UTC（臺灣 10 月 15 日）歸檔的 Vettalon hunt 工具輸出中，逐欄選取此案例的候選位置、`needs_human` 判定、產生草稿及原始 JSONL 行雜湊；未公開其他候選。原完整 `hunt.json`、當時來源位元組及可公開寄件收據未找回；人工送件由使用者確認，Ammonia 維護者在修補 PR #267 公開確認收到 zhixuli0406 的 email，RustSec 列 Louis Li 為通報者。原始 email 與寄件系統收據未公開。此節錄只證產品輸出與擬稿紀錄，未單獨證明寄送或當時原始碼位元組。原始 JSONL 沒有公開，第三方也無法單靠行雜湊獨立重算這筆輸出。

`public/evidence/regressions/` 放五項固定函式庫政策測試摘要：4.2.3 為 3 過 2 失敗，官方 4.2.4 為 5 過 0 失敗。HTTPS 正常控制有三種大小寫輸入，因此合計七組輸入。第二輪 4.2.3 比較的外層控制器因額外指紋檢查回報失敗；保存的原始測試輸出及來源綁定，後經修正的唯讀驗證器核對，並未重跑目標。完整原始 log 不公開；JSON 含兩版各六行測試輸出節錄。這不代表瀏覽器實際載入、完整產品掃描流程、應用整合或所有受影響版本已驗證。

## 建置與人工驗收

```sh
npm run check
```

建置前 `validate-evidence.mjs` 逐一核對 manifest 與公開附件的固定路徑、schema、大小、UTF-8 及 SHA-256；預渲染後再核對 dist 複本。`publication-text-gate.mjs` 掃描輸出文字資產，拒絕私有路徑或測試 sentinel。這些檢查證明所選資料與建置產物一致，不是可信執行簽章，也不能代替人工查核來源。上線前還需檢查中英文列表、搜尋、篩選、空狀態、逐案頁、附件下載、行動版、鍵盤操作、canonical／hreflang 與 sitemap。

`tests/evidence-render.test.mjs` 驗證三筆案例的證據類型、四段順序、實際附件與上游連結，以及歷史案例沒有修補版對照的明示。人工瀏覽器驗收仍需在窄螢幕確認不橫向溢出、按 Tab 能走完所有連結，並開啟／下載附件確認部署後可達；SSR 的字串測試不代表上述行為已完成。

原報告節錄的瀏覽器預覽需點擊後才讀取；`load-dossier.js` 對同源固定附件設 5 秒總期限與 64 KiB 串流上限，驗證實際位元組 SHA-256、strict UTF-8、JSON 與 schema 後才顯示。成功預覽只代表公開附件與頁面摘要一致，不代表歷史執行、漏洞可利用性或原始報告真實性。
