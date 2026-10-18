#!/usr/bin/env python3
"""Fail closed on the published aiohttp ZIP and run its bounded offline readback."""

from __future__ import annotations

import argparse
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import sys
import tempfile
from zipfile import ZipFile, ZIP_STORED


CASE = "benchmarks/real-oss-pairs/aiohttp/"
REPORT = "reports/evidence-acceptance/aiohttp-paired-20261019/"
RAW = REPORT + "run-08/"
MEMBERS = (
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


def validate(root: Path) -> None:
    source = root / "evidence-bundles/aiohttp-paired-20261019"
    bundle = root / "public/evidence/bundles/aiohttp-paired-20261019.zip"
    if (source.is_symlink() or bundle.is_symlink() or not bundle.is_file()
            or not 100 < bundle.stat().st_size <= 512 * 1024):
        raise ValueError("bundle_path")
    for parent in (source.parent, bundle.parent, bundle.parent.parent):
        if parent.is_symlink() or not parent.is_dir():
            raise ValueError("bundle_parent")
    with ZipFile(bundle) as archive:
        infos = archive.infolist()
        if archive.comment or tuple(info.filename for info in infos) != MEMBERS:
            raise ValueError("member_inventory")
        if sum(info.file_size for info in infos) > 512 * 1024:
            raise ValueError("expanded_cap")
        contents = {}
        for info in infos:
            path = PurePosixPath(info.filename)
            if (path.is_absolute() or str(path) != info.filename or ".." in path.parts
                    or info.compress_type != ZIP_STORED or info.flag_bits & 1
                    or not stat.S_ISREG(info.external_attr >> 16)
                    or info.file_size > 256 * 1024 or info.file_size != info.compress_size):
                raise ValueError("member_policy")
            original = source.joinpath(*path.parts)
            if original.is_symlink() or not original.is_file():
                raise ValueError("source_member")
            raw = archive.read(info)
            if raw != original.read_bytes() or any(pattern.search(raw) for pattern in DENIED):
                raise ValueError("member_content")
            contents[info.filename] = raw
    with tempfile.TemporaryDirectory(prefix="aiohttp-public-verify-") as scratch:
        directory = Path(scratch)
        for name, raw in contents.items():
            target = directory.joinpath(*PurePosixPath(name).parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
        command = [sys.executable, "-B", "-I", "-S", REPORT + "verify.py"]
        result = subprocess.run(command, cwd=directory, env={}, stdin=subprocess.DEVNULL,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                timeout=10, check=False)
        if result.returncode != 0:
            raise ValueError("offline_readback")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        validate(args.root.resolve())
        print("Public aiohttp ZIP contents and offline readback verified.")
        return 0
    except Exception:
        print("Public aiohttp ZIP validation failed.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
