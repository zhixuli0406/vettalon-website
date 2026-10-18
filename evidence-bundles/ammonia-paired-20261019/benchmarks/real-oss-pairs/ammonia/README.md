# Ammonia 官方雙版本政策回歸

這個案例用官方 Ammonia 4.2.3 與 4.2.4 crate，比對 CSS `url()` 大小寫下的網址限制是否一致，並確認兩版對允許的 HTTPS 仍能正常處理。這是固定函式庫政策案例，不執行瀏覽器、外部請求或產品掃描。

## 來源與範圍

- [官方 GHSA](https://github.com/rust-ammonia/ammonia/security/advisories/GHSA-x43w-36pp-96g3)、[RustSec RUSTSEC-2026-0373](https://rustsec.org/advisories/RUSTSEC-2026-0373.html) 與[修補 PR #267](https://github.com/rust-ammonia/ammonia/pull/267) 定義修補邊界。RustSec 明述此案例不構成 XSS；此處也不宣稱瀏覽器行為或資料外洩能力。
- `source-manifest.json` 固定 crates.io 的兩個 `.crate` SHA-256、crate 內 `.cargo_vcs_info.json` 的 Git commit、官方 repository tag、Rust image digest。執行前查核來源版本與 124 筆相同的鎖定依賴；來源不提交至本倉庫。
- [`official-tags.raw`](../../../reports/evidence-acceptance/ammonia-paired-20261019/official-tags.raw) 另從官方 Git repository `git ls-remote` 讀回兩個 tag（同時查 `^{}`，實際為非 annotated tag），與 crate 內 Git commit 相符。這次讀回時間為 2026-10-18 16:21:01 UTC，發生在本次封存配對輪期間，但與容器執行獨立；不是 Docker run 時的網路連線。
- `policy_tests.rs` 在兩版加入**同一份**五方法、七個固定輸入的測試。4.2.3 預期 3 通過／2 失敗；4.2.4 預期 5 通過／0 失敗。低大小寫 HTTP 與相對路徑被拒絕，HTTPS 在三種函式拼法下作一般功能控制。網址固定於 `.invalid`；不觸發網路。

## 執行與讀回

需要 Python 3.12+、Docker、Rust image `rust@sha256:6ae102bdbf528294bc79ad6e1fae682f6f7c2a6e6621506ba959f9685b308a55`。主機準備來源與 Cargo vendor 時可連網；**每一個編譯／測試容器**均 `--network none`、唯讀根檔案系統與來源掛載、非 root、無 capabilities、CPU 1、1.5 GiB 記憶體／tmpfs、PID 128、450 秒內部逾時及 500 秒外部逾時。兩版分開編譯、各自新 target，容器名稱唯一且每次都嘗試清理並讀回不存在狀態。

```sh
docker pull rust@sha256:6ae102bdbf528294bc79ad6e1fae682f6f7c2a6e6621506ba959f9685b308a55
python3 benchmarks/real-oss-pairs/ammonia/run_pair.py --output-dir /tmp/ammonia-pair-new
python3 -B -m unittest discover -s benchmarks/real-oss-pairs/ammonia -p 'test_*.py'
```

`run_pair.py` 預設在**啟動容器前**，用官方鎖檔執行 `cargo vendor --locked`；準備失敗即停止。若已有先前核對過、SHA-256 與 manifest 相同的離線 payload，可加 `--vendor-payload /安全路徑/payload.tar`，僅讀取其中 3,984 個 vendor 檔案。公開收據採這個 pinned payload 入口；fresh `cargo vendor` 入口尚未在本機重新執行，不能視為相同收據。

該 payload 是既有的 **本機 pinned 檔案**，沒有隨本案例公開。離線 verifier 只讀回已封存 stdout/stderr、收據與來源／tag 雜湊，不能獨立見證當時 Docker 政策確實生效、crates.io 回應或 registry 來源；這些屬於執行程式記錄並經審查的宣告。

執行會建立一個全新的 output 目錄，留下 `receipt.json` 與兩版原始 stdout/stderr。輸出逐串流寫檔，任一串流超過 256 KiB 就停止；即使讀回檔案或來源失敗，`finally` 仍嘗試移除專屬容器並確認不存在。收據列出本 runner SHA、兩份官方 crate 成員 SHA、測試插入前後來源 SHA、容器 inspect 實際政策、exit code、清理與語義結果。任何缺失標成 `incomplete` 並以非零退出。主機在每版啟動前若低於 8 GiB 可用空間，也停止執行。公開的縮減結果與離線驗證器位於 [`reports/evidence-acceptance/ammonia-paired-20261019/`](../../../reports/evidence-acceptance/ammonia-paired-20261019/)。

本案例驗證已知修補在固定 caller policy 下的回歸，不能推論完整受影響版本、終端 App、瀏覽器 XSS、外部可達性、Vettalon 自動檢出率或正式發版驗收。

## License

新增測試程式沿用本 repository 授權；上游 Ammonia 為 MIT OR Apache-2.0，來源僅在執行時暫存。
