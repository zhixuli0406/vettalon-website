# 公開案例維護指南

證據牆目前發布三筆不同類型的紀錄：aiohttp 與 PHPUnit 是歷史漏洞的聚焦識別測試，ammonia 是 Louis Li 向上游通報後的函式庫政策回歸測試。兩筆歷史紀錄保留原報告的 `needs_human`／`candidate` 狀態；ammonia 不宣稱由 Vettalon 掃描自動發現。Bollard 的 advisory 仍未公開，不列入本站。

## 新增或修訂案例

公開清單只編輯 `src/evidence/cases.js`。不得匯入掃描目錄、私有報告、揭露追蹤表或未公開的上游 advisory。每筆須有可公開的來源、版本、方法、日期、歸屬、限制與中英文摘要；`publication` 必須為 `public`。`src/evidence/schema.js` 拒絕未知欄位、非公開狀態、不安全連結、重複 ID、私有本機路徑與不一致的驗證狀態。

`source-reviewed` 只代表公開來源已核對；`detected` 要保留原 finding 的實際判定及來源位置，不能改寫成利用成功；`regression-verified` 要有同組脆弱版／修補版的逐項結果；`reproduced` 才能呈現差分重現，並需要公開附件、雜湊、脆弱效果、修補對照與正常控制。`type: discovery` 另需公開上游歸屬和重現證據，不能靠一般公告 URL 推定原創發現。

aiohttp／PHPUnit 的 `public/evidence/dossiers/` 只保留逐欄挑選的單筆 finding 及有效覆核文字。原始掃描報告未公開，`detection.sha256` 是供持有原件者比對的雜湊；附件本身另有 SHA-256。PHPUnit 的 runtime error trace 省略且仍為 `no_verdict`；aiohttp 的 `plausible` 仍為 `needs_human`。公開 tag／行號只是參考，不能證明歷史原始碼位元組。

ammonia 的 `public/evidence/regressions/` 僅放五項固定函式庫政策測試摘要：4.2.3 為 3 過 2 失敗，官方 4.2.4 為 5 過 0 失敗。HTTPS 正常控制有三種大小寫輸入，因此合計七組輸入。完整原始 log 不公開；JSON 含兩版各六行測試輸出節錄。這不代表瀏覽器實際載入、產品掃描、應用整合或所有受影響版本已驗證。

## 建置與人工驗收

```sh
npm run check
```

建置前 `validate-evidence.mjs` 逐一核對 manifest 與公開附件的固定路徑、schema、大小、UTF-8 及 SHA-256；預渲染後再核對 dist 複本。`publication-text-gate.mjs` 掃描輸出文字資產，拒絕私有路徑或測試 sentinel。這些檢查證明所選資料與建置產物一致，不是可信執行簽章，也不能代替人工查核來源。上線前還需檢查中英文列表、搜尋、篩選、空狀態、逐案頁、附件下載、行動版、鍵盤操作、canonical／hreflang 與 sitemap。

原報告節錄的瀏覽器預覽需點擊後才讀取；`load-dossier.js` 對同源固定附件設 5 秒總期限與 64 KiB 串流上限，驗證實際位元組 SHA-256、strict UTF-8、JSON 與 schema 後才顯示。成功預覽只代表公開附件與頁面摘要一致，不代表歷史執行、漏洞可利用性或原始報告真實性。
