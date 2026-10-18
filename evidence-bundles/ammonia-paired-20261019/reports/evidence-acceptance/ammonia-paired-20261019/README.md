# Archived paired run

Official Ammonia 4.2.3: 3 passed, 2 expected policy failures.
Official Ammonia 4.2.4: 5 passed, 0 failed. Both versions passed the
allowed-HTTPS normal control. The archived run completed on
2026-10-18 at 16:21:33 UTC.

The raw `weak.*.raw` and `fixed.*.raw` files are the captured stdout and
stderr. `receipt.json` records source, harness, runner, image and vendor
pins, container inspection, output digests, exit codes and cleanup readback.
`official-tags.raw` and `official-tags.receipt.json` are a separate
official Git tag readback made during the run; the containers had network
disabled.

From the package root, run `python3 -B -I -S
reports/evidence-acceptance/ammonia-paired-20261019/verify.py`.
Its result establishes internal consistency of this archive, not independent
attestation of Docker or the prior download. The pinned dependency vendor
payload is not published. See the root README for scope and limitations.
