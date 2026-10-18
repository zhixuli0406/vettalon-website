#!/usr/bin/env python3
"""Build or compare the allowlisted, deterministic public aiohttp evidence ZIP."""

import argparse
import io
from pathlib import Path
import re
import sys
from zipfile import ZipFile, ZipInfo, ZIP_STORED


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evidence-bundles/aiohttp-paired-20261019"
OUTPUT = ROOT / "public/evidence/bundles/aiohttp-paired-20261019.zip"
CASE = "benchmarks/real-oss-pairs/aiohttp/"
REPORT = "reports/evidence-acceptance/aiohttp-paired-20261019/"
RAW = REPORT + "run-08/"
FILES = (
    "LICENSE", "README.md",
    CASE + "README.md", CASE + "harness.py", CASE + "run_pair.py",
    CASE + "source-manifest.json", CASE + "test_run_pair.py",
    REPORT + "verify.py",
    *tuple(RAW + name for name in (
        "fixed-normal-request.http", "fixed-normal-response.http",
        "fixed-stderr.raw", "fixed-stdout.raw",
        "fixed-traversal-request.http", "fixed-traversal-response.http",
        "receipt.json",
        "weak-normal-request.http", "weak-normal-response.http",
        "weak-stderr.raw", "weak-stdout.raw",
        "weak-traversal-request.http", "weak-traversal-response.http",
    )),
)
DENIED = (
    re.compile(rb"/Users/|/home/|github\.com/zhixuli0406/vettalon-pro", re.I),
    re.compile(rb"DO_NOT_PUBLISH_PRIVATE_SENTINEL|PRIVATE_PREVIEW_SENTINEL|SECRET_SENTINEL"),
    re.compile(rb"ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|polar_[A-Za-z0-9_]{20,}"),
)


def archive_bytes() -> bytes:
    actual = {p.relative_to(SOURCE).as_posix() for p in SOURCE.rglob("*") if p.is_file()}
    if actual != set(FILES) or any(p.is_symlink() for p in SOURCE.rglob("*")):
        raise ValueError("Unexpected public aiohttp source member")
    stream = io.BytesIO()
    with ZipFile(stream, "w", compression=ZIP_STORED) as archive:
        for name in FILES:
            data = (SOURCE / name).read_bytes()
            if len(data) > 256 * 1024 or any(pattern.search(data) for pattern in DENIED):
                raise ValueError("Evidence member rejected")
            member = ZipInfo(name, date_time=(2026, 10, 19, 0, 0, 0))
            member.compress_type = ZIP_STORED
            member.external_attr = 0o100644 << 16
            archive.writestr(member, data)
    result = stream.getvalue()
    if len(result) > 512 * 1024:
        raise ValueError("Evidence bundle too large")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = archive_bytes()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_bytes() != expected:
            print("Public aiohttp ZIP differs from allowlisted source.", file=sys.stderr)
            return 1
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(expected)
    return 0


if __name__ == "__main__":
    sys.exit(main())
