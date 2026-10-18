#!/usr/bin/env python3
"""Offline readback of the pinned local aiohttp paired receipt and raw HTTP."""

from __future__ import annotations

import argparse
import base64
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CASE = ROOT / "benchmarks/real-oss-pairs/aiohttp"
SPEC = importlib.util.spec_from_file_location("aiohttp_pair_runner", CASE / "run_pair.py")
pair = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pair)
RUN06_RUNNER_SHA256 = "a28388c79e4c4550ec93fdd559abb11238391acd17f302d4cff7f7cc183f8ee7"
RUN06_RECEIPT_SHA256 = "f5761374a85679c59e87e6f2608d0b7452cea932a190084861710b43112887c9"
RUN07_RUNNER_SHA256 = "4ff5d0c191b2b4b7c8744f8d0a77e512a35c145109588bc0f1154e743f86eeef"
RUN07_RECEIPT_SHA256 = "e671ac7f22be142fa265952738ca4599dc44220791105842e5f62b13525f014c"
RUN08_RUNNER_SHA256 = "b7e986355da917460c051b64633bb69b93af69309b7552d32fb3ad5a3478d064"
RUN08_RECEIPT_SHA256 = "f8fb7d624c920dcf2881925617d8bee652b643538ccf0fecc6a6bbd44d4b87dc"


def require(value: bool, reason: str) -> None:
    if not value:
        raise ValueError(reason)


def verify_run06_incomplete(directory: Path) -> None:
    """Read back the failed sixth attempt without promoting it to paired success."""
    receipt_bytes = (directory / "receipt.json").read_bytes()
    require(pair.sha(receipt_bytes) == RUN06_RECEIPT_SHA256, "run-06 receipt mismatch")
    receipt = json.loads(receipt_bytes)
    manifest = pair.MANIFEST
    require(receipt["schema"] == "aiohttp-paired-receipt-v1"
            and receipt["status"] == "incomplete"
            and receipt["error"] == "container_execution_failed", "failure status mismatch")
    require(receipt["runner_sha256"] == RUN06_RUNNER_SHA256
            and receipt["runner_sha256"] != pair.sha((CASE / "run_pair.py").read_bytes()),
            "historical runner binding mismatch")
    require(receipt["manifest_sha256"] == pair.sha((CASE / "source-manifest.json").read_bytes())
            and receipt["harness_sha256"] == pair.sha((CASE / "harness.py").read_bytes()),
            "manifest or harness mismatch")
    require(receipt["image"] == manifest["image"]
            and receipt["image_local"] == {"id": manifest["image_id_arm64"],
                                           "architecture": manifest["image_arch"]},
            "image mismatch")
    require(set(receipt["packages"]) == set(manifest["packages"]), "package set mismatch")
    for name, entry in manifest["packages"].items():
        require(receipt["packages"][name] == {key: entry[key] for key in
                ("filename", "sha256", "bytes", "url")}, f"{name} package mismatch")
    require(set(receipt["sources"]) == {"weak"} and set(receipt["runs"]) == {"weak"},
            "partial run set mismatch")
    source = receipt["sources"]["weak"]
    require(source["source_root"] == "aiohttp-3.9.1"
            and source["upstream_file_sha256"] == manifest["upstream_files"]["3.9.1"],
            "weak source mismatch")
    run = receipt["runs"]["weak"]
    require(run["exit_code"] == 0 and run["capture_problem"] is None
            and run["process_cleanup_error"] == "process_group_signal_failed"
            and run["cleanup_absent"] is True and run["cleanup_remove_confirmed"] is True
            and run["cleanup_remove_exit_code"] == 0 and run["cells"] == {},
            "weak incomplete run mismatch")
    pair.validate_isolation(run["container_inspection"], receipt["image_local"]["id"])
    for stream in ("stdout", "stderr"):
        data = (directory / f"weak-{stream}.raw").read_bytes()
        require(pair.sha(data) == run[f"{stream}_sha256"]
                and len(data) == run[f"{stream}_bytes"], f"weak {stream} raw mismatch")
        if stream == "stdout":
            stdout = data
        else:
            require(not data, "weak stderr nonempty")
    observation = json.loads(stdout)
    require(observation["version"] == "3.9.1"
            and set(observation["cells"]) == set(pair.REQUESTS), "weak stdout mismatch")
    for name, cell in observation["cells"].items():
        request = base64.b64decode(cell["request_b64"], validate=True)
        raw = base64.b64decode(cell["response_b64"], validate=True)
        require(cell["request_sha256"] == pair.sha(request)
                and cell["response_sha256"] == pair.sha(raw)
                and cell["response_bytes"] == len(raw), f"weak {name} digest mismatch")
        pair.validate_cell("weak", name, request, raw)
    print("pass_incomplete_readback: historical run-06 failed before fixed arm")


def verify_run07_incomplete(directory: Path) -> None:
    """Read back the mount-source mismatch without promoting the weak cells to a pair."""
    receipt_bytes = (directory / "receipt.json").read_bytes()
    require(pair.sha(receipt_bytes) == RUN07_RECEIPT_SHA256, "run-07 receipt mismatch")
    receipt = json.loads(receipt_bytes)
    require(receipt["schema"] == "aiohttp-paired-receipt-v1"
            and receipt["status"] == "incomplete"
            and receipt["error"] == "container_isolation_mismatch"
            and receipt["runner_sha256"] == RUN07_RUNNER_SHA256
            and receipt["runner_sha256"] != pair.sha((CASE / "run_pair.py").read_bytes()),
            "run-07 failure or runner binding mismatch")
    require(set(receipt["runs"]) == {"weak"} and set(receipt["sources"]) == {"weak"},
            "run-07 partial arm mismatch")
    run = receipt["runs"]["weak"]
    require(run["exit_code"] == 0 and run["capture_problem"] is None
            and run["process_cleanup_error"] is None and run["cleanup_absent"] is True
            and run["cleanup_remove_confirmed"] is True and "validated" not in run,
            "run-07 execution or cleanup mismatch")
    observed = {item["destination"]: item["source_sha256"]
                for item in run["container_inspection"]["mounts"]}
    expected = run["mount_source_sha256"]
    require(set(observed) == set(expected) == {"/harness.py", "/site", "/source"}
            and observed["/harness.py"] == expected["/harness.py"]
            and observed["/site"] != expected["/site"]
            and observed["/source"] != expected["/source"],
            "run-07 mount mismatch pattern changed")
    for stream in ("stdout", "stderr"):
        data = (directory / f"weak-{stream}.raw").read_bytes()
        require(pair.sha(data) == run[f"{stream}_sha256"]
                and len(data) == run[f"{stream}_bytes"], f"weak {stream} raw mismatch")
        if stream == "stderr":
            require(not data, "weak stderr nonempty")
        else:
            stdout = data
    observation = json.loads(stdout)
    require(observation["version"] == "3.9.1"
            and set(observation["cells"]) == set(pair.REQUESTS)
            and set(run["cells"]) == set(pair.REQUESTS), "run-07 weak cells mismatch")
    for name, cell in observation["cells"].items():
        request = (directory / f"weak-{name}-request.http").read_bytes()
        response = (directory / f"weak-{name}-response.http").read_bytes()
        require(cell["request_b64"] == base64.b64encode(request).decode()
                and cell["response_b64"] == base64.b64encode(response).decode()
                and cell["request_sha256"] == pair.sha(request)
                and cell["response_sha256"] == pair.sha(response)
                and cell["response_bytes"] == len(response), f"run-07 {name} raw mismatch")
        expected_cell = pair.validate_cell("weak", name, request, response)
        expected_cell.update({"request_sha256": pair.sha(request), "request_bytes": len(request),
                              "response_sha256": pair.sha(response), "response_bytes": len(response)})
        require(run["cells"][name] == expected_cell, f"run-07 {name} cell mismatch")
    print("pass_incomplete_readback: historical run-07 stopped at mount isolation")


def verify_incomplete(directory: Path | None = None) -> None:
    directory = directory or HERE / "run-07"
    receipt = json.loads((directory / "receipt.json").read_text(encoding="utf-8"))
    if receipt["runner_sha256"] == RUN06_RUNNER_SHA256:
        verify_run06_incomplete(directory)
    elif receipt["runner_sha256"] == RUN07_RUNNER_SHA256:
        verify_run07_incomplete(directory)
    else:
        raise ValueError("unknown incomplete runner")


def main(directory: Path | None = None) -> None:
    directory = directory or HERE / "run-08"
    receipt_bytes = (directory / "receipt.json").read_bytes()
    require(pair.sha(receipt_bytes) == RUN08_RECEIPT_SHA256, "run-08 receipt mismatch")
    receipt = json.loads(receipt_bytes)
    manifest = pair.MANIFEST
    require(receipt["schema"] == "aiohttp-paired-receipt-v1", "schema mismatch")
    require(receipt["status"] == "pass_paired_property" and receipt["error"] is None,
            "receipt incomplete")
    require(receipt["runner_sha256"] == RUN08_RUNNER_SHA256, "run-08 runner mismatch")
    for key, path in (("manifest_sha256", CASE / "source-manifest.json"),
                      ("harness_sha256", CASE / "harness.py"),
                      ("runner_sha256", CASE / "run_pair.py")):
        require(receipt[key] == pair.sha(path.read_bytes()), f"{key} mismatch")
    require(receipt["image"] == manifest["image"]
            and receipt["image_local"]["architecture"] == manifest["image_arch"]
            and receipt["image_local"]["id"] == manifest["image_id_arm64"], "image mismatch")
    require(set(receipt["packages"]) == set(manifest["packages"]), "package set mismatch")
    for name, entry in manifest["packages"].items():
        require(receipt["packages"][name] == {key: entry[key] for key in
                ("filename", "sha256", "bytes", "url")}, f"{name} package mismatch")
    require(set(receipt["sources"]) == {"weak", "fixed"}, "source pair missing")
    require(set(receipt["runs"]) == {"weak", "fixed"}, "run pair missing")
    for label, version in (("weak", "3.9.1"), ("fixed", "3.9.2")):
        source = receipt["sources"][label]
        require(source["source_root"] == f"aiohttp-{version}"
                and source["members"] > 0 and source["unpacked_bytes"] > 0
                and source["upstream_file_sha256"] == manifest["upstream_files"][version],
                f"{label} source mismatch")
        run = receipt["runs"][label]
        require(run["exit_code"] == 0 and run["timed_out"] is False
                and run["timeout_seconds"] == 30 and run["validated"] is True
                and run["capture_problem"] is None and run["process_cleanup_error"] is None
                and run["cleanup_absent"] is True
                and run["cleanup_remove_confirmed"] is True
                and run["cleanup_remove_exit_code"] == 0
                and "inspect_error" not in run and "cleanup_error" not in run,
                f"{label} execution or cleanup mismatch")
        mount_sources = run["mount_source_sha256"]
        require(set(mount_sources) == {"/harness.py", "/site", "/source"}
                and all(len(value) == 64 and all(c in "0123456789abcdef" for c in value)
                        for value in mount_sources.values())
                and len(set(mount_sources.values())) == 3,
                f"{label} mount source receipt mismatch")
        pair.validate_isolation(run["container_inspection"], receipt["image_local"]["id"],
                                mount_sources)
        for stream in ("stdout", "stderr"):
            data = (directory / f"{label}-{stream}.raw").read_bytes()
            require(pair.sha(data) == run[f"{stream}_sha256"]
                    and len(data) == run[f"{stream}_bytes"], f"{label} {stream} mismatch")
            if stream == "stderr":
                require(not data, f"{label} stderr nonempty")
            else:
                stdout = data
        observation = json.loads(stdout)
        require(observation["version"] == version
                and set(observation["cells"]) == set(pair.REQUESTS)
                and set(run["cells"]) == set(pair.REQUESTS), f"{label} observation mismatch")
        for name in pair.REQUESTS:
            cell = observation["cells"][name]
            request = (directory / f"{label}-{name}-request.http").read_bytes()
            raw = (directory / f"{label}-{name}-response.http").read_bytes()
            require(cell["request_b64"] == base64.b64encode(request).decode()
                    and cell["response_b64"] == base64.b64encode(raw).decode()
                    and cell["request_sha256"] == pair.sha(request)
                    and cell["response_sha256"] == pair.sha(raw)
                    and cell["response_bytes"] == len(raw), f"{label} {name} raw mismatch")
            expected = pair.validate_cell(label, name, request, raw)
            expected.update({"request_sha256": pair.sha(request), "request_bytes": len(request),
                             "response_sha256": pair.sha(raw), "response_bytes": len(raw)})
            require(run["cells"][name] == expected, f"{label} {name} cell mismatch")
    print("pass_offline_readback: aiohttp 3.9.1/3.9.2 four raw HTTP cells")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt-dir", type=Path,
                        help="Receipt folder; defaults to run-08, or run-07 with --expect-incomplete")
    parser.add_argument("--expect-incomplete", action="store_true",
                        help="Verify archived incomplete attempt without claiming paired success")
    args = parser.parse_args()
    try:
        if args.expect_incomplete:
            verify_incomplete(args.receipt_dir)
        else:
            main(args.receipt_dir)
    except (OSError, KeyError, ValueError, TypeError, pair.PairError) as exc:
        print(f"fail_offline_readback: {exc}", file=sys.stderr)
        sys.exit(1)
