#!/usr/bin/env python3
"""Read back the archived Ammonia pair without network or code execution."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
CASE = REPO / "benchmarks/real-oss-pairs/ammonia"
EXPECTED = {
    "weak": {
        "archive": "061e83b03c2681c18a6787d956e355c74e0b98ba7ba3d69b0822ade1e6f1d716",
        "commit": "61fd35d351a91762eb622503bc6b2964319907b3",
        "lock": "b87e19eff4ace589459ea665f1ccdf42daef6e37dc1871eb7ce70a224519e329",
        "lib": "228b874da4cc12edf506822bfa253fb22ad774636f932d70f4fcff6365cfa9b6",
        "style": "24b880f34e34c11d07aa47ca12cd7ad8af50479dc39d5bfb9a8878053e706ea5",
        "test_lib": "2913b40b75f3ed2273c9458aee8063d3fc0483fdad4ba375ab1e01c11b76cc2b",
        "exit": 101, "pass": 3, "fail": 2,
    },
    "fixed": {
        "archive": "1f45dfa685e1ec33b1bf1a3b93b8047cbdbef41b6040deebbe6bea7720a45574",
        "commit": "72d56debf499cc88adc253c326d05a3563b8ee06",
        "lock": "1645ad6d3850e94178d4e438a907eff8b16f38d5884093cf5e7c16a3cc4ae894",
        "lib": "9b8276beb8f58aa791b6b7a6d8f04d41bdd2067bc981b4d3c2c1b0c203be4d23",
        "style": "cd81a1517ff3cb8be2b97ea4947d249ab267bd93153f7b04d1cfa3fef0ccfa17",
        "test_lib": "40da64d3af6c2e0f904a461a01b2f8c1f287fa533aad9b98b4393a8728c9d76f",
        "exit": 0, "pass": 5, "fail": 0,
    },
}
METHODS = {"http_lower_denied", "relative_lower_denied", "http_upper_denied",
           "relative_mixed_denied", "https_control"}
WEAK_FAILED = {"http_upper_denied", "relative_mixed_denied"}
EXPECTED_FILES = {"receipt.json", "weak.stdout.raw", "weak.stderr.raw",
                  "fixed.stdout.raw", "fixed.stderr.raw", "official-tags.raw",
                  "official-tags.receipt.json", "verify.py", "test_verify.py", "README.md"}


class VerificationError(ValueError):
    pass


def require(condition: bool, code: str) -> None:
    if not condition:
        raise VerificationError(code)


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def bounded_file(directory: Path, name: str, cap: int) -> bytes:
    path = directory / name
    require(not path.is_symlink() and path.is_file() and path.stat().st_size <= cap, "file_missing_symlink_or_cap")
    return path.read_bytes()


def verify_semantics(label: str, stdout: bytes, stderr: bytes) -> dict:
    try:
        output = stdout.decode("utf-8")
        errors = stderr.decode("utf-8")
    except UnicodeError as exc:
        raise VerificationError("raw_not_utf8") from exc
    observed = re.findall(r"^test test::policy_css_url_(\w+) \.\.\. (ok|FAILED)$", output, re.MULTILINE)
    wanted = {method: "FAILED" if label == "weak" and method in WEAK_FAILED else "ok"
              for method in METHODS}
    require(len(observed) == 5 and dict(observed) == wanted, "method_oracle_mismatch")
    require(output.splitlines().count("running 5 tests") == 1, "test_denominator_mismatch")
    require("test test::policy_css_url_https_control ... ok" in output, "normal_control_failed")
    wanted_summary = ("test result: FAILED. 3 passed; 2 failed; 0 ignored;" if label == "weak"
                      else "test result: ok. 5 passed; 0 failed; 0 ignored;")
    require(wanted_summary in output, "summary_mismatch")
    require(f"Compiling ammonia v{'4.2.3' if label == 'weak' else '4.2.4'} (/source)" in errors,
            "source_compile_missing")
    return wanted


def verify(directory: Path = HERE) -> dict:
    directory = directory.resolve()
    actual_files = {path.name for path in directory.iterdir()}
    require({"receipt.json", "weak.stdout.raw", "weak.stderr.raw", "fixed.stdout.raw", "fixed.stderr.raw"}
            .issubset(actual_files), "raw_files_missing")
    require(actual_files.issubset(EXPECTED_FILES), "unexpected_file")
    receipt = json.loads(bounded_file(directory, "receipt.json", 1024 * 1024))
    manifest = json.loads(bounded_file(CASE, "source-manifest.json", 1024 * 1024))
    tag_raw = bounded_file(directory, "official-tags.raw", 1024)
    tag_receipt = json.loads(bounded_file(directory, "official-tags.receipt.json", 4096))
    expected_tags = {f"refs/tags/{entry['tag']}": entry["tag_commit"]
                     for entry in manifest["versions"].values()}
    try:
        tags = dict((ref, commit) for commit, ref in
                    (line.split("\t") for line in tag_raw.decode("ascii").strip().splitlines()))
    except Exception as exc:
        raise VerificationError("tag_raw_invalid") from exc
    require(tags == expected_tags and tag_receipt.get("tag_refs") == expected_tags and
            tag_receipt.get("schema") == "ammonia-official-tags-readback-v1" and
            tag_receipt.get("exit_code") == 0 and tag_receipt.get("annotated_tags") is False and
            tag_receipt.get("stdout_sha256") == sha256(tag_raw) and
            tag_receipt.get("stdout_bytes") == len(tag_raw), "tag_readback_mismatch")
    require(receipt.get("schema") == "ammonia-paired-receipt-v1" and
            receipt.get("status") == "pass_paired_property" and receipt.get("error") is None,
            "receipt_incomplete")
    require(receipt.get("manifest_sha256") == sha256((CASE / "source-manifest.json").read_bytes())
            and receipt.get("harness_sha256") == sha256((CASE / "policy_tests.rs").read_bytes())
            and receipt.get("runner_sha256") == sha256((CASE / "run_pair.py").read_bytes()),
            "runner_input_digest_mismatch")
    require(receipt.get("image") == manifest["image"] and receipt.get("image_local", {}).get("id", "").startswith("sha256:"),
            "image_pin_mismatch")
    require(receipt.get("registry_lock_records_equal") is True and receipt.get("registry_lock_records") == 124,
            "registry_lock_mismatch")
    vendor = receipt.get("vendor", {})
    require(vendor == {"mode": "pinned_prior_payload", "sha256": manifest["verified_local_vendor_payload_sha256"],
                       "files": 3984}, "vendor_pin_mismatch")
    require(set(receipt.get("sources", {})) == {"weak", "fixed"} and
            set(receipt.get("runs", {})) == {"weak", "fixed"}, "arm_denominator_mismatch")
    for label, expected in EXPECTED.items():
        entry = receipt["sources"][label]
        require(entry.get("archive_sha256") == expected["archive"] and
                entry.get("git_commit") == expected["commit"] and
                entry.get("members", {}).get("Cargo.lock") == expected["lock"] and
                entry.get("members", {}).get("src/lib.rs") == expected["lib"] and
                entry.get("members", {}).get("src/style.rs") == expected["style"] and
                len(entry.get("members", {})) == 23 and
                entry.get("original_lib_sha256") == expected["lib"] and
                entry.get("test_lib_sha256") == expected["test_lib"] and
                entry.get("inserted_tests_sha256") == receipt["harness_sha256"],
                "source_pin_mismatch")
        record = receipt["runs"][label]
        require(record.get("capture_problem") is None and record.get("cleanup_remove_exit_code") == 0
                and all(field not in record for field in ("readback_error", "cleanup_remove_error",
                                                           "cleanup_post_inspect_error")),
                "capture_or_cleanup_detail_mismatch")
        source_hashes = {"Cargo.toml": entry["members"]["Cargo.toml"],
                         "Cargo.lock": expected["lock"], "src/lib.rs": expected["test_lib"],
                         "src/style.rs": expected["style"],
                         "src/vettalon_policy_tests.rs": receipt["harness_sha256"]}
        require(record.get("source_unchanged") is True and record.get("source_before") == source_hashes
                and record.get("source_after") == source_hashes, "source_runtime_hash_mismatch")
        stdout = bounded_file(directory, f"{label}.stdout.raw", 256 * 1024)
        stderr = bounded_file(directory, f"{label}.stderr.raw", 256 * 1024)
        require(record.get("stdout_sha256") == sha256(stdout) and record.get("stdout_bytes") == len(stdout)
                and record.get("stderr_sha256") == sha256(stderr) and record.get("stderr_bytes") == len(stderr),
                "raw_digest_mismatch")
        wanted = verify_semantics(label, stdout, stderr)
        require(record.get("exit_code") == expected["exit"] and
                record.get("observation") == {"methods": wanted, "pass": expected["pass"],
                                              "fail": expected["fail"], "normal_control": "ok"},
                "receipt_semantics_mismatch")
        policy = record.get("container_policy", {})
        require(record.get("inspect_verified") is True and record.get("cleanup_absent") is True and
                policy.get("exit_code") == expected["exit"] and policy.get("oom_killed") is False and
                policy.get("image_id") == receipt["image_local"]["id"] and
                policy.get("network") == "none" and policy.get("root_readonly") is True and
                policy.get("privileged") is False and policy.get("user") == "65532:65532" and
                [str(x).upper() for x in policy.get("cap_drop") or []] == ["ALL"] and
                "no-new-privileges=true" in (policy.get("security_opt") or []) and
                policy.get("memory_bytes") == 1610612736 and policy.get("memory_swap_bytes") == 1610612736 and
                policy.get("pids_limit") == 128 and policy.get("nano_cpus") == 1000000000 and
                policy.get("mounts") == [{"destination": "/source", "type": "bind", "rw": False},
                                          {"destination": "/vendor", "type": "bind", "rw": False}] and
                policy.get("tmpfs") == {"/work": "rw,exec,nosuid,nodev,size=1536m,uid=65532,gid=65532,mode=0700"},
                "container_or_cleanup_mismatch")
    return {"status": "verified", "weak": "3 pass / 2 expected fail", "fixed": "5 pass / 0 fail",
            "scope": "official crates, fixed inert caller-policy fixture, pinned offline vendor"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=HERE)
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.root), sort_keys=True))
        return 0
    except Exception as exc:
        print(json.dumps({"status": "incomplete", "error": type(exc).__name__}, sort_keys=True))
        return 1


if __name__ == "__main__":
    sys.exit(main())
