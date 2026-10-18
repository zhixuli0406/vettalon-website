# aiohttp 雙版本本地 HTTP 配對

這個案例用官方 aiohttp 3.9.1 與 3.9.2 的完整 PyPI source distributions，各自在隔離容器內啟動靜態檔路由並送出固定 raw HTTP 請求。它只驗證 [GHSA-5h86-8mv2-jq9f](https://github.com/aio-libs/aiohttp/security/advisories/GHSA-5h86-8mv2-jq9f) 已公開修補的這個輸入差分。

## 來源與範圍

`source-manifest.json` 固定兩個官方 PyPI sdist、所有執行依賴 wheel 的檔名、URL、byte 數與 SHA-256，以及 Python image digest。sdist SHA-256 分別為 `8fc49a87ac269d4529da45871e2ffb6874e87779c3d0e2ccd813c0899221239d` 與 `b0ad0a5e86ce73f5368a164c10ada10504bf91869c05ab75d982c6048217fbf7`。解開完整 sdist 後，腳本另核 `aiohttp/web_urldispatcher.py` 與 `LICENSE.txt`，其 SHA-256 與既有官方 Git tag 來源紀錄相同。第三方套件本體不提交到此 repo。

執行時直接由完整 sdist 匯入 aiohttp Python 原始碼，使用其純 Python 路徑；沒有編譯 sdist 的 C 擴充。這次可觀察的靜態檔處理路徑已在容器中實際執行，但結果不等於所有安裝方式或平台的驗證。

Fixture 在容器 `/tmp/fixture/safe/public.txt` 寫入固定 public bytes，並在相鄰的 `/tmp/fixture/private_file` 寫入固定 marker；完全沒有 symlink。路由是 `web.static('/', safe, follow_symlinks=True)`。raw socket 送 `GET /../private_file HTTP/1.1` 與 `GET /public.txt HTTP/1.1`，檢查 status、完整 body、`Content-Length` 與 SHA。預期 3.9.1 的 traversal 回 200 與 marker，3.9.2 回 404 且沒有 marker；兩版正常路徑均回 200 與 public bytes。

官方公告指出修補後 `follow_symlinks=True` 仍可能因顯式指向根外的 symlink 造成設定風險。本 fixture 沒有 symlink，因此結果**不代表一般根外檔案皆不可讀**。這是已知 CVE 的本地固定輸入 oracle，不是 Vettalon 自動檢出率、任意服務可達性或新漏洞發現。

## 執行

需要 Python 3.10+、Docker 與 ARM64 Docker host。容器使用固定 `python:3.12-slim` digest；若尚未備妥 image，可先執行：

```sh
docker pull python@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1
python3 benchmarks/real-oss-pairs/aiohttp/run_pair.py --output-dir /tmp/aiohttp-pair-result
python3 -B -I -S -m unittest discover -s benchmarks/real-oss-pairs/aiohttp -p 'test_*.py'
```

輸出目錄必須尚不存在。下載發生在 host 的準備階段，按 URL、大小與 SHA 核對；可用 `--package-dir DIR` 指向已備妥的完整檔案，離線重跑。容器用 `--network none`，只有內部 loopback，唯讀根檔案系統與 bind mounts，非 root，沒有主機憑證掛載，並限制 CPU、記憶體、PID、檔案數與執行時間。新版 runner 逐一核對 Docker inspect 的三個 bind mount 來源與本次暫存來源；收據只存來源路徑 SHA-256，不寫入本機絕對路徑。離線讀回可核對收據中的預期與觀測 hash，但暫存路徑已移除，無法事後重建來源字串。Docker CLI 由獨立程序群組監督，stdout／stderr 串流各限 128 KiB；超額或逾時即停止程序群組，再移除並確認容器。任何套件、image、HTTP、隔離檢查或清理失敗都回傳非零與 `incomplete` 收據，沒有降級重試。

成功時每格留下 raw request／response、容器 stdout／stderr、SHA、byte 數、status、body SHA、Docker inspect 與 cleanup receipt。[目前歸檔](../../../reports/evidence-acceptance/aiohttp-paired-20261019/) 的最新 `run-08` 是與目前 runner SHA 綁定的本機四格 `pass_paired_property` 收據；`run-06/07` 的 incomplete 歷史仍保留。CI 執行無網路契約測試與收據／raw 讀回，不下載套件或重新執行容器。

## License

此目錄程式沿用本 repo 授權；上游 aiohttp sdist 的 `LICENSE.txt` 為 Apache-2.0，未隨案例提交。
