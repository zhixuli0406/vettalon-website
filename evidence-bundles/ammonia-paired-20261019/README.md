# Ammonia 4.2.3 → 4.2.4 paired caller-policy evidence

This package contains a fixed, inert CSS `url()` policy test against the official
Ammonia 4.2.3 and 4.2.4 crates. The archived run ended at 2026-10-18
16:21:33 UTC: five policy methods passed 3/5 on 4.2.3 and 5/5 on 4.2.4.
The allowed HTTPS control passed on both versions.

Four earlier setup/controller pilots were incomplete and are excluded from
this result; their receipts are not part of this public package. This package
contains one complete paired run.

The `reports/evidence-acceptance/ammonia-paired-20261019/` directory includes
both arms' raw stdout/stderr, the run receipt, an independent official-tag
readback, and an offline verifier. The `benchmarks/real-oss-pairs/ammonia/`
directory includes the exact test, source manifest, and runner pinned by the
receipt. These are self-authored materials; upstream source and the local
dependency vendor payload are not included.

From the extracted package root:

```sh
python3 -B -I -S reports/evidence-acceptance/ammonia-paired-20261019/verify.py
python3 -B -I -S -m unittest discover -s reports/evidence-acceptance/ammonia-paired-20261019 -p 'test_*.py'
```

The verifier checks archive consistency, source/harness hashes recorded in
the receipt, the five-method denominator, both normal controls, and recorded
container policy. It cannot independently witness the historical Docker run,
the crates.io response, or the withheld pinned dependency payload. A fresh
run may use the public runner's `cargo vendor --locked` preparation path,
which was not the path used by this archived receipt. Review the benchmark
README before running Docker.

This post-fix pair is separate from the original Vettalon 4.1.7
`needs_human` hunt and human disclosure. It does not establish browser XSS,
application integration, external reachability, all affected versions, or a
Vettalon detection rate. Upstream Ammonia is MIT OR Apache-2.0 licensed; no
upstream source archive is redistributed here. The self-authored code in this
package is distributed under Apache-2.0 (see LICENSE).
