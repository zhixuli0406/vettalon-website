# aiohttp 3.9.1 → 3.9.2 local HTTP pair

This archive contains the successful `run-08` fixed-input HTTP comparison for
the already disclosed CVE-2024-23334. In the self-authored fixture,
`GET /../private_file` returned the inert 37-byte marker on official aiohttp
3.9.1 and 404 without the marker on official 3.9.2. `GET /public.txt` returned
the same 37-byte normal control on both versions. The fixture has no symlink.

The archived run ended on 2026-10-18 UTC. The package includes the two arms'
raw HTTP requests and responses, stdout and stderr, receipt, pinned package
manifest, harness, runner and offline verifier. The official source distributions,
dependency wheels and Docker image are pinned in the manifest but are not
redistributed. Earlier incomplete runs are preserved in the development
repository and are excluded from this package.

From the extracted archive root, run:

```sh
python3 -B -I -S reports/evidence-acceptance/aiohttp-paired-20261019/verify.py
```

The verifier checks the receipt and raw four-cell results against the included
runner, harness and manifest. It cannot independently witness the historical
Docker execution or package downloads. The older Vettalon focused scan remains
a separate `needs_human` candidate; this pair does not establish a product
detection rate, remote exploitability of an arbitrary service, an original
discovery, or safety for explicit symlinks pointing outside the static root.

Self-authored materials are distributed under Apache-2.0 (see LICENSE).
Upstream aiohttp source is not included.
