#!/usr/bin/env python3
"""Run a source-pinned Ammonia caller-policy pair in bounded offline containers."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import selectors
import shutil
import signal
import subprocess
import sys
import tarfile
import tempfile
import time
import tomllib
import urllib.request
from uuid import uuid4


BASE = Path(__file__).resolve().parent
MANIFEST = json.loads((BASE / "source-manifest.json").read_text())
IMAGE = MANIFEST["image"]
METHODS = {
    "http_lower_denied", "relative_lower_denied", "http_upper_denied",
    "relative_mixed_denied", "https_control",
}
WEAK_FAILED = {"http_upper_denied", "relative_mixed_denied"}
CAP = 256 * 1024
DOCKER_SECONDS = 500
SOURCE_SECONDS = 30


class PairError(RuntimeError):
    """A fixed public-safe failure code."""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_digest(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def bounded_process(args: list[str], stdout_path: Path, stderr_path: Path, *, timeout: int,
                    cwd: Path | None = None) -> dict:
    """Capture each stream to a capped file and stop the process on cap or deadline."""
    process = None
    problem = None
    streams = {}
    with stdout_path.open("xb") as stdout_file, stderr_path.open("xb") as stderr_file:
        try:
            process = subprocess.Popen(args, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                       start_new_session=True)
            deadline = time.monotonic() + timeout
            with selectors.DefaultSelector() as selector:
                for pipe, target in ((process.stdout, stdout_file), (process.stderr, stderr_file)):
                    os.set_blocking(pipe.fileno(), False)
                    selector.register(pipe, selectors.EVENT_READ, target)
                    streams[pipe] = 0
                while selector.get_map() or process.poll() is None:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        problem = "timeout"
                        break
                    if not selector.get_map():
                        time.sleep(min(remaining, 0.05))
                        continue
                    for key, _ in selector.select(timeout=min(remaining, 0.25)):
                        pipe = key.fileobj
                        chunk = os.read(pipe.fileno(), 65536)
                        if not chunk:
                            selector.unregister(pipe)
                            pipe.close()
                            continue
                        room = CAP - streams[pipe]
                        if len(chunk) > room:
                            key.data.write(chunk[:room])
                            streams[pipe] = CAP
                            problem = "output_cap"
                            break
                        key.data.write(chunk)
                        streams[pipe] += len(chunk)
                    if problem:
                        break
        finally:
            if process is not None:
                if problem is not None or process.poll() is None:
                    try:
                        os.killpg(process.pid, signal.SIGTERM)
                    except ProcessLookupError:
                        pass
                    try:
                        process.wait(timeout=0.25 if problem is not None else 2)
                    except subprocess.TimeoutExpired:
                        pass
                    if problem is not None or process.poll() is None:
                        # A child may still own the pipes after its parent exits.
                        time.sleep(0.1)
                        try:
                            os.killpg(process.pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                        process.wait(timeout=2)
                for pipe in (process.stdout, process.stderr):
                    if pipe is not None and not pipe.closed:
                        pipe.close()
            stdout_file.flush()
            stderr_file.flush()
    return {"exit_code": process.returncode if process is not None else None, "problem": problem}


def fetch_crate(version: str, expected_sha: str) -> bytes:
    url = f"https://static.crates.io/crates/ammonia/ammonia-{version}.crate"
    try:
        with urllib.request.urlopen(url, timeout=SOURCE_SECONDS) as response:
            if response.status != 200:
                raise PairError("crate_http_status")
            raw = response.read(1024 * 1024 + 1)
    except PairError:
        raise
    except Exception as exc:
        raise PairError("crate_fetch_failed") from exc
    if len(raw) > 1024 * 1024 or digest(raw) != expected_sha:
        raise PairError("crate_size_or_sha_mismatch")
    return raw


def unpack_crate(raw: bytes, version: str, destination: Path, expected_commit: str) -> dict:
    destination.mkdir()
    prefix = f"ammonia-{version}/"
    members = {}
    destinations = set()
    expanded = 0
    try:
        import io
        with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as bundle:
            for member in bundle:
                if not member.isfile() or not member.name.startswith(prefix):
                    raise PairError("crate_member_type_or_prefix")
                name = member.name[len(prefix):]
                path = PurePosixPath(name)
                if (not name or member.name != prefix + str(path) or path.is_absolute()
                        or any(part in ("", ".", "..") for part in path.parts)
                        or str(path) in destinations):
                    raise PairError("crate_member_path")
                if name in members or len(members) >= 64 or member.size > 1024 * 1024:
                    raise PairError("crate_member_cap")
                data = bundle.extractfile(member).read(member.size + 1)
                expanded += len(data)
                if len(data) != member.size or expanded > 1024 * 1024:
                    raise PairError("crate_expanded_cap")
                target = destination.joinpath(*path.parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                members[name] = digest(data)
                destinations.add(str(path))
    except PairError:
        raise
    except Exception as exc:
        raise PairError("crate_extract_failed") from exc
    required = {"Cargo.toml", "Cargo.lock", "src/lib.rs", "src/style.rs", ".cargo_vcs_info.json", "LICENSE-MIT", "LICENSE-APACHE"}
    if not required.issubset(members) or len(members) != 23:
        raise PairError("crate_members_unexpected")
    vcs = json.loads((destination / ".cargo_vcs_info.json").read_bytes())
    manifest = tomllib.loads((destination / "Cargo.toml").read_text())
    if vcs.get("git", {}).get("sha1") != expected_commit or manifest["package"]["version"] != version:
        raise PairError("crate_version_or_git_mismatch")
    return {"archive_sha256": digest(raw), "git_commit": expected_commit, "members": members}


def registry_packages(source: Path) -> set[tuple[str, str, str]]:
    lock = tomllib.loads((source / "Cargo.lock").read_text())
    return {(row["name"], row["version"], row["checksum"])
            for row in lock["package"] if row.get("source", "").startswith("registry+")}


def stage_tests(source: Path) -> dict:
    library = source / "src/lib.rs"
    original = library.read_bytes()
    marker = b"#[cfg(test)]\nmod test {\n"
    if original.count(marker) != 1 or b"include!(\"vettalon_policy_tests.rs\");" in original:
        raise PairError("test_insertion_marker")
    injection = marker + b"    include!(\"vettalon_policy_tests.rs\");\n"
    library.write_bytes(original.replace(marker, injection, 1))
    test_copy = source / "src/vettalon_policy_tests.rs"
    test_copy.write_bytes((BASE / "policy_tests.rs").read_bytes())
    return {"original_lib_sha256": digest(original), "test_lib_sha256": file_digest(library),
            "inserted_tests_sha256": file_digest(test_copy)}


def extract_pinned_vendor(payload: Path, destination: Path) -> dict:
    if file_digest(payload) != MANIFEST["verified_local_vendor_payload_sha256"]:
        raise PairError("vendor_payload_sha_mismatch")
    destination.mkdir()
    count = 0
    expanded = 0
    destinations = set()
    with tarfile.open(payload, mode="r:") as bundle:
        for member in bundle:
            if not member.name.startswith("vendor/"):
                continue
            path = PurePosixPath(member.name)
            target_relative = PurePosixPath(*path.parts[1:])
            if (not member.isfile() or member.name != str(path) or path.is_absolute()
                    or len(path.parts) < 3 or path.parts[0] != "vendor"
                    or any(part in ("", ".", "..") for part in path.parts)
                    or str(target_relative) in destinations):
                raise PairError("vendor_member_type_or_path")
            if member.size > 16 * 1024 * 1024 or count >= 3984:
                raise PairError("vendor_member_cap")
            data = bundle.extractfile(member).read(member.size + 1)
            expanded += len(data)
            if len(data) != member.size or expanded > 180 * 1024 * 1024:
                raise PairError("vendor_expanded_cap")
            target = destination.joinpath(*target_relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            destinations.add(str(target_relative))
            count += 1
    if count != 3984 or len(list(destination.glob("*/.cargo-checksum.json"))) != 124:
        raise PairError("vendor_count_mismatch")
    return {"mode": "pinned_prior_payload", "sha256": file_digest(payload), "files": count}


def fetch_vendor(source: Path, destination: Path) -> dict:
    destination.mkdir()
    try:
        with tempfile.TemporaryDirectory(prefix="vettalon-vendor-log-", dir=destination.parent) as logs:
            result = bounded_process(["cargo", "vendor", "--locked", "--versioned-dirs", str(destination)],
                                     Path(logs) / "stdout.raw", Path(logs) / "stderr.raw",
                                     timeout=240, cwd=source)
    except Exception as exc:
        raise PairError("cargo_vendor_fetch_failed") from exc
    if result["exit_code"] != 0 or result["problem"] is not None:
        raise PairError("cargo_vendor_failed_or_output_cap")
    count = sum(1 for path in destination.rglob("*") if path.is_file())
    if count < 100 or count > 5000 or len(list(destination.glob("*/.cargo-checksum.json"))) != 124:
        raise PairError("cargo_vendor_count_mismatch")
    return {"mode": "fresh_cargo_vendor", "files": count}


def docker_args(name: str, source: Path, vendor: Path) -> list[str]:
    return ["docker", "run", "--pull=never", "--name", name, "--network", "none",
            "--read-only", "--user", "65532:65532", "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges=true", "--cpus", "1",
            "--memory", "1536m", "--memory-swap", "1536m", "--pids-limit", "128",
            "--log-driver", "none", "--ulimit", "core=0:0",
            "--tmpfs", "/work:rw,exec,nosuid,nodev,size=1536m,uid=65532,gid=65532,mode=0700",
            "--mount", f"type=bind,src={source},dst=/source,readonly",
            "--mount", f"type=bind,src={vendor},dst=/vendor,readonly",
            "--workdir", "/work", "--entrypoint", "/usr/bin/env", IMAGE, "-i",
            "PATH=/usr/local/cargo/bin:/usr/local/bin:/usr/bin:/bin",
            "HOME=/work", "CARGO_HOME=/work/cargo-home", "RUSTUP_HOME=/usr/local/rustup",
            "CARGO_TARGET_DIR=/work/target", "TMPDIR=/work/tmp",
            "CARGO_BUILD_JOBS=1", "CARGO_NET_OFFLINE=true", "CARGO_NET_RETRY=0",
            "CARGO_INCREMENTAL=0", "CARGO_TERM_COLOR=never", "RUSTUP_AUTO_INSTALL=0",
            "/usr/bin/timeout", "--signal=TERM", "--kill-after=5s", "450s",
            "/bin/sh", "-c", """mkdir -p /work/cargo-home /work/target /work/tmp && printf '[source.crates-io]\\nreplace-with = "vendored-sources"\\n[source.vendored-sources]\\ndirectory = "/vendor"\\n[net]\\noffline = true\\n' > /work/cargo-home/config.toml && exec cargo test --locked --offline --manifest-path /source/Cargo.toml --lib policy_css_url_ -- --test-threads=1"""]


def inspect_container(name: str) -> dict:
    result = subprocess.run(["docker", "inspect", name], capture_output=True, timeout=15, check=False)
    if result.returncode != 0:
        raise PairError("container_inspect_failed")
    try:
        return json.loads(result.stdout)[0]
    except Exception as exc:
        raise PairError("container_inspect_invalid") from exc


def observed_policy(info: dict, name: str) -> dict:
    host = info["HostConfig"]
    config = info["Config"]
    mounts = info.get("Mounts") or []
    record = {
        "name": info["Name"], "image_id": info["Image"], "network": host["NetworkMode"],
        "root_readonly": host["ReadonlyRootfs"], "privileged": host["Privileged"],
        "user": config["User"], "cap_drop": host["CapDrop"],
        "security_opt": host["SecurityOpt"], "memory_bytes": host["Memory"],
        "memory_swap_bytes": host["MemorySwap"], "pids_limit": host["PidsLimit"],
        "nano_cpus": host["NanoCpus"], "tmpfs": host["Tmpfs"],
        "mounts": sorted(({"destination": m["Destination"], "type": m["Type"], "rw": m["RW"]}
                          for m in mounts), key=lambda row: row["destination"]),
        "exit_code": info["State"]["ExitCode"], "oom_killed": info["State"]["OOMKilled"],
    }
    expected_mounts = [{"destination": "/source", "type": "bind", "rw": False},
                       {"destination": "/vendor", "type": "bind", "rw": False}]
    if (record["name"] != "/" + name or record["network"] != "none" or not record["root_readonly"]
            or record["privileged"] or record["user"] != "65532:65532"
            or [str(x).upper() for x in record["cap_drop"] or []] != ["ALL"]
            or "no-new-privileges=true" not in (record["security_opt"] or [])
            or record["memory_bytes"] != 1610612736 or record["memory_swap_bytes"] != 1610612736
            or record["pids_limit"] != 128 or record["nano_cpus"] != 1000000000
            or record["mounts"] != expected_mounts or record["oom_killed"]
            or record["tmpfs"] != {"/work": "rw,exec,nosuid,nodev,size=1536m,uid=65532,gid=65532,mode=0700"}):
        raise PairError("observed_container_policy_mismatch")
    return record


def parse_observation(label: str, stdout: bytes, stderr: bytes, exit_code: int) -> dict:
    text = stdout.decode("utf-8")
    errors = stderr.decode("utf-8")
    matches = re.findall(r"^test test::policy_css_url_(\w+) \.\.\. (ok|FAILED)$", text, re.MULTILINE)
    actual = dict(matches)
    expected = {name: "FAILED" if label == "weak" and name in WEAK_FAILED else "ok" for name in METHODS}
    normal = "test::policy_css_url_https_control ... ok"
    summary = ("test result: FAILED. 3 passed; 2 failed; 0 ignored;" if label == "weak"
               else "test result: ok. 5 passed; 0 failed; 0 ignored;")
    wanted_exit = 101 if label == "weak" else 0
    if (len(matches) != 5 or actual != expected or text.splitlines().count("running 5 tests") != 1
            or normal not in text or summary not in text or exit_code != wanted_exit
            or f"Compiling ammonia v{MANIFEST['versions'][label]['version']} (/source)" not in errors):
        raise PairError(f"{label}_semantic_result_mismatch")
    return {"methods": actual, "pass": 3 if label == "weak" else 5,
            "fail": 2 if label == "weak" else 0, "normal_control": "ok"}


def missing_container(result: subprocess.CompletedProcess[bytes], name: str) -> bool:
    if result.returncode == 0:
        return False
    message = result.stderr.decode("utf-8", "replace").strip().lower()
    return message in (f"error: no such object: {name.lower()}",
                       f"error response from daemon: no such container: {name.lower()}")


def run_arm(label: str, source: Path, vendor: Path, output: Path, runs: dict) -> dict:
    name = "vettalon-ammonia-pair-" + uuid4().hex[:16]
    record = {"container_name": name, "timeout_seconds": DOCKER_SECONDS,
              "cleanup_absent": False, "inspect_verified": False}
    runs[label] = record
    source_names = ("Cargo.toml", "Cargo.lock", "src/lib.rs", "src/style.rs", "src/vettalon_policy_tests.rs")
    stdout_path = output / f"{label}.stdout.raw"
    stderr_path = output / f"{label}.stderr.raw"
    run_error = None
    try:
        source_before = {path: file_digest(source / path) for path in source_names}
        record["source_before"] = source_before
        run = bounded_process(docker_args(name, source, vendor), stdout_path, stderr_path,
                              timeout=DOCKER_SECONDS)
        record["exit_code"] = run["exit_code"]
        record["capture_problem"] = run["problem"]
        if run["problem"] is not None:
            raise PairError(f"{label}_{run['problem']}")
        record["observation"] = parse_observation(label, stdout_path.read_bytes(),
                                                   stderr_path.read_bytes(), run["exit_code"])
    except PairError as exc:
        run_error = str(exc)
    except Exception:
        run_error = f"{label}_runtime_error"
    finally:
        try:
            for stream, path in (("stdout", stdout_path), ("stderr", stderr_path)):
                if path.exists():
                    record[f"{stream}_bytes"] = path.stat().st_size
                    record[f"{stream}_sha256"] = file_digest(path)
            if "source_before" in record:
                record["source_after"] = {path: file_digest(source / path) for path in source_names}
                record["source_unchanged"] = record["source_after"] == record["source_before"]
            try:
                info = inspect_container(name)
                record["container_policy"] = observed_policy(info, name)
                record["inspect_verified"] = (record.get("exit_code") is not None and
                                               info["State"]["ExitCode"] == record["exit_code"])
            except Exception:
                record["inspect_verified"] = False
        except Exception:
            record["readback_error"] = "output_or_source_readback_failed"
        finally:
            try:
                removed = subprocess.run(["docker", "rm", "-f", name],
                                         capture_output=True, timeout=15, check=False)
                record["cleanup_remove_exit_code"] = removed.returncode
            except Exception:
                record["cleanup_remove_error"] = "docker_remove_failed"
            try:
                after = subprocess.run(["docker", "inspect", name],
                                       capture_output=True, timeout=15, check=False)
                record["cleanup_absent"] = (record.get("cleanup_remove_exit_code") == 0 and
                                            missing_container(after, name))
            except Exception:
                record["cleanup_post_inspect_error"] = "docker_post_inspect_failed"
    if run_error is not None:
        raise PairError(run_error)
    if record.get("readback_error"):
        raise PairError(f"{label}_readback_failed")
    if not record["inspect_verified"] or not record["cleanup_absent"] or not record["source_unchanged"]:
        raise PairError(f"{label}_inspection_or_cleanup_failed")
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--vendor-payload", type=Path,
                        help="Existing pinned offline payload; otherwise fetch locked vendor crates before isolation")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=False)
    receipt = {"schema": "ammonia-paired-receipt-v1", "status": "incomplete",
               "started_utc": datetime.now(timezone.utc).isoformat(),
               "case": "quoted-css-url-caller-policy", "scope": "library policy only; no browser, app, or Vettalon detection",
               "manifest_sha256": file_digest(BASE / "source-manifest.json"),
               "harness_sha256": file_digest(BASE / "policy_tests.rs"),
               "runner_sha256": file_digest(BASE / "run_pair.py"),
               "image": IMAGE, "sources": {}, "runs": {}, "error": None}
    try:
        with tempfile.TemporaryDirectory(prefix="vettalon-ammonia-pair-") as tempdir:
            temp = Path(tempdir)
            for label, entry in MANIFEST["versions"].items():
                raw = fetch_crate(entry["version"], entry["crate_sha256"])
                source = temp / label
                receipt["sources"][label] = unpack_crate(raw, entry["version"], source, entry["tag_commit"])
            weak_registry = registry_packages(temp / "weak")
            fixed_registry = registry_packages(temp / "fixed")
            if weak_registry != fixed_registry or len(weak_registry) != 124:
                raise PairError("registry_lock_pair_mismatch")
            receipt["registry_lock_records_equal"] = True
            receipt["registry_lock_records"] = 124
            for label in ("weak", "fixed"):
                receipt["sources"][label].update(stage_tests(temp / label))
            vendor = temp / "vendor"
            receipt["vendor"] = (extract_pinned_vendor(args.vendor_payload.resolve(), vendor)
                                 if args.vendor_payload else fetch_vendor(temp / "fixed", vendor))
            image = subprocess.run(["docker", "image", "inspect", IMAGE, "--format",
                                    "{{json .RepoDigests}}|{{.Id}}|{{.Architecture}}"],
                                   capture_output=True, timeout=20, check=False)
            fields = image.stdout.decode().strip().split("|", 2)
            if image.returncode != 0 or len(fields) != 3 or IMAGE not in json.loads(fields[0]):
                raise PairError("docker_image_digest_unavailable")
            receipt["image_local"] = {"id": fields[1], "architecture": fields[2]}
            for label in ("weak", "fixed"):
                if shutil.disk_usage(temp).free < 8 * 1024 * 1024 * 1024:
                    raise PairError("host_free_space_below_8gib")
                run_arm(label, temp / label, vendor, output, receipt["runs"])
            receipt["status"] = "pass_paired_property"
    except PairError as exc:
        receipt["error"] = str(exc)
    except Exception as exc:
        receipt["error"] = "internal_error:" + type(exc).__name__
    finally:
        receipt["finished_utc"] = datetime.now(timezone.utc).isoformat()
        (output / "receipt.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"status": receipt["status"], "error": receipt["error"],
                      "receipt": str(output / "receipt.json")}, sort_keys=True))
    return 0 if receipt["status"] == "pass_paired_property" else 1


if __name__ == "__main__":
    sys.exit(main())
