#!/usr/bin/env python3
"""Run the pinned aiohttp source pair inside isolated local containers."""

from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import selectors
import shutil
import signal
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request
from uuid import uuid4
import zipfile


BASE = Path(__file__).resolve().parent
MANIFEST_PATH = BASE / "source-manifest.json"
MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
IMAGE = MANIFEST["image"]
MARKER = b"AIOHTTP_PAIR_PRIVATE_MARKER_20261019\n"
PUBLIC = b"AIOHTTP_PAIR_PUBLIC_CONTROL_20261019\n"
REQUESTS = {
    "traversal": b"GET /../private_file HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n",
    "normal": b"GET /public.txt HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n",
}
OUTPUT_CAP = 131072


class PairError(RuntimeError):
    """A public-safe failure code."""


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def command(args: list[str], timeout: int = 30) -> subprocess.CompletedProcess[bytes]:
    result = bounded_command(args, timeout=timeout)
    if result.returncode:
        raise PairError(f"{args[0]}_failed")
    return result


def bounded_process(args: list[str], stdout_path: Path, stderr_path: Path, *,
                    timeout: float, cap: int = OUTPUT_CAP) -> dict:
    """Capture both pipes to capped files, then terminate the process group before reaping."""
    process = None
    problem = None
    cleanup_error = None
    byte_counts = {"stdout": 0, "stderr": 0}
    with stdout_path.open("xb") as stdout_file, stderr_path.open("xb") as stderr_file:
        try:
            process = subprocess.Popen(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE, start_new_session=True)
            deadline = time.monotonic() + timeout
            with selectors.DefaultSelector() as selector:
                for name, pipe, target in (("stdout", process.stdout, stdout_file),
                                           ("stderr", process.stderr, stderr_file)):
                    os.set_blocking(pipe.fileno(), False)
                    selector.register(pipe, selectors.EVENT_READ, (name, target))
                while selector.get_map():
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        problem = "timeout"
                        break
                    for key, _ in selector.select(timeout=min(remaining, 0.1)):
                        chunk = os.read(key.fileobj.fileno(), 65536)
                        if not chunk:
                            selector.unregister(key.fileobj)
                            key.fileobj.close()
                            continue
                        name, target = key.data
                        room = cap - byte_counts[name]
                        target.write(chunk[:room])
                        byte_counts[name] += min(len(chunk), room)
                        if len(chunk) > room:
                            problem = "output_cap"
                            break
                    if problem:
                        break
        except OSError:
            problem = problem or "capture_or_spawn_failed"
        except Exception:
            problem = problem or "capture_internal_error"
        finally:
            if process is not None:
                # The leader remains unreaped while its process-group ID is signalled.
                signal_failed = False
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                except OSError:
                    signal_failed = True
                if signal_failed:
                    # Retry only while the unreaped leader still reserves this PGID.
                    try:
                        os.killpg(process.pid, 0)
                    except OSError:
                        pass
                    else:
                        try:
                            os.killpg(process.pid, signal.SIGKILL)
                        except OSError:
                            pass
                try:
                    process.wait(timeout=2)
                except (OSError, subprocess.TimeoutExpired):
                    cleanup_error = "process_group_reap_failed"
                if cleanup_error is None:
                    # getpgid(leader) cannot prove its descendants are gone.
                    # After reap, only ESRCH for the group ID proves absence.
                    try:
                        os.killpg(process.pid, 0)
                    except ProcessLookupError:
                        pass
                    except OSError:
                        cleanup_error = "process_group_probe_failed"
                    else:
                        cleanup_error = "process_group_still_present"
                for pipe in (process.stdout, process.stderr):
                    if pipe is not None and not pipe.closed:
                        pipe.close()
            stdout_file.flush()
            stderr_file.flush()
    return {"exit_code": process.returncode if process is not None else None,
            "problem": problem, "cleanup_error": cleanup_error,
            "stdout_bytes": byte_counts["stdout"], "stderr_bytes": byte_counts["stderr"]}


def bounded_command(args: list[str], *, timeout: float = 30) -> subprocess.CompletedProcess[bytes]:
    with tempfile.TemporaryDirectory(prefix="vettalon-aiohttp-command-") as temporary:
        base = Path(temporary)
        stdout_path, stderr_path = base / "stdout", base / "stderr"
        capture = bounded_process(args, stdout_path, stderr_path, timeout=timeout)
        if capture["problem"] or capture["cleanup_error"]:
            raise PairError(f"{args[0]}_capture_failed")
        return subprocess.CompletedProcess(args, capture["exit_code"],
                                           stdout_path.read_bytes(), stderr_path.read_bytes())


def read_package(entry: dict, package_dir: Path | None) -> bytes:
    path = package_dir / entry["filename"] if package_dir else None
    if path is not None:
        if not path.is_file() or path.is_symlink():
            raise PairError("pinned_package_missing")
        data = path.read_bytes()
    else:
        try:
            request = urllib.request.Request(entry["url"], headers={"User-Agent": "vettalon-aiohttp-pair/1"})
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.geturl() != entry["url"]:
                    raise PairError("package_redirect")
                data = response.read(entry["bytes"] + 1)
        except (OSError, TimeoutError) as exc:
            raise PairError("package_download_failed") from exc
    if len(data) != entry["bytes"] or sha(data) != entry["sha256"]:
        raise PairError("pinned_package_hash_or_size_mismatch")
    return data


def safe_path(name: str, root_name: str | None = None) -> Path:
    path = PurePosixPath(name)
    if (path.is_absolute() or not path.parts or any(x in ("", ".", "..") for x in path.parts)
            or (root_name and path.parts[0] != root_name)):
        raise PairError("archive_unsafe_path")
    return Path(*path.parts)


def extract_sdist(data: bytes, destination: Path, version: str) -> dict:
    archive = destination / "source.tar.gz"
    archive.write_bytes(data)
    root_name = f"aiohttp-{version}"
    count = 0
    total = 0
    try:
        with tarfile.open(archive, "r:gz") as package:
            for member in package:
                relative = safe_path(member.name, root_name)
                if member.isdir():
                    (destination / relative).mkdir(parents=True, exist_ok=True)
                    continue
                if not member.isfile() or member.size > 8_000_000:
                    raise PairError("sdist_unsafe_member")
                count += 1
                total += member.size
                if count > 3000 or total > 50_000_000:
                    raise PairError("sdist_size_limit")
                target = destination / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                source = package.extractfile(member)
                if source is None:
                    raise PairError("sdist_extract_failed")
                with source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)
    except (OSError, tarfile.TarError) as exc:
        raise PairError("sdist_extract_failed") from exc
    finally:
        archive.unlink(missing_ok=True)
    source_root = destination / root_name
    if not (source_root / "aiohttp/__init__.py").is_file():
        raise PairError("sdist_package_missing")
    file_hashes = {}
    for relative, expected in MANIFEST["upstream_files"][version].items():
        actual = sha((source_root / relative).read_bytes())
        if actual != expected:
            raise PairError("sdist_upstream_file_mismatch")
        file_hashes[relative] = actual
    return {"members": count, "unpacked_bytes": total, "source_root": root_name,
            "upstream_file_sha256": file_hashes}


def extract_wheels(packages: dict[str, bytes], destination: Path) -> dict:
    count = 0
    total = 0
    for name, data in packages.items():
        try:
            with zipfile.ZipFile(__import__("io").BytesIO(data)) as wheel:
                for item in wheel.infolist():
                    relative = safe_path(item.filename)
                    if item.is_dir():
                        (destination / relative).mkdir(parents=True, exist_ok=True)
                        continue
                    count += 1
                    total += item.file_size
                    if count > 3000 or total > 40_000_000 or item.file_size > 8_000_000:
                        raise PairError("wheel_size_limit")
                    target = destination / relative
                    if target.exists():
                        raise PairError("wheel_path_collision")
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with wheel.open(item) as source, target.open("wb") as output:
                        shutil.copyfileobj(source, output)
        except (OSError, zipfile.BadZipFile) as exc:
            raise PairError(f"{name}_wheel_extract_failed") from exc
    return {"members": count, "unpacked_bytes": total}


def make_readable(path: Path) -> None:
    path.chmod(0o755)
    for child in path.rglob("*"):
        child.chmod(0o755 if child.is_dir() else 0o644)


def parse_response(raw: bytes) -> tuple[int, bytes]:
    head, sep, body = raw.partition(b"\r\n\r\n")
    if not sep or len(head) > 16384:
        raise PairError("http_header_missing_or_oversize")
    lines = head.split(b"\r\n")
    first = lines.pop(0).split(b" ", 2)
    if len(first) != 3 or first[0] != b"HTTP/1.1" or not first[1].isdigit():
        raise PairError("http_status_invalid")
    headers: dict[bytes, bytes] = {}
    for line in lines:
        key, colon, value = line.partition(b":")
        if not colon or not key or key.lower() in headers:
            raise PairError("http_header_invalid")
        headers[key.lower()] = value.strip()
    length = headers.get(b"content-length")
    if length is None or not length.isdigit() or b"transfer-encoding" in headers:
        raise PairError("http_length_missing")
    if len(body) != int(length):
        raise PairError("http_body_truncated_or_extra")
    return int(first[1]), body


def validate_cell(label: str, name: str, request: bytes, raw: bytes) -> dict:
    if request != REQUESTS[name]:
        raise PairError("request_tampered")
    status, body = parse_response(raw)
    if name == "normal":
        if status != 200 or body != PUBLIC:
            raise PairError("normal_control_failed")
    elif label == "weak":
        if status != 200 or body != MARKER:
            raise PairError("weak_marker_missing")
    elif status != 404 or MARKER in body:
        raise PairError("fixed_traversal_not_rejected")
    return {"status": status, "body_sha256": sha(body), "body_bytes": len(body),
            "marker_present": MARKER in body}


def mount_source_paths(source: Path, site: Path) -> dict[str, str]:
    # Preserve the exact spelling passed to Docker; macOS /var may resolve to /private/var.
    return {"/source": str(source), "/site": str(site),
            "/harness.py": str(BASE / "harness.py")}


def docker_args(label: str, source: Path, site: Path, name: str) -> list[str]:
    mounts = mount_source_paths(source, site)
    return ["docker", "run", "--pull", "never", "--name", name, "--network", "none",
            "--read-only", "--user", "65534:65534", "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges=true", "--pids-limit", "64",
            "--memory", "256m", "--cpus", "1", "--ulimit", "nofile=64:64",
            "--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=32m",
            "--env", "PYTHONDONTWRITEBYTECODE=1", "--env", "PYTHONNOUSERSITE=1",
            "--mount", f"type=bind,src={mounts['/source']},dst=/source,readonly",
            "--mount", f"type=bind,src={mounts['/site']},dst=/site,readonly",
            "--mount", f"type=bind,src={mounts['/harness.py']},dst=/harness.py,readonly",
            "--entrypoint", "python", IMAGE, "-B", "-I", "/harness.py"]


def inspect_container(name: str) -> dict:
    result = command(["docker", "container", "inspect", name, "--format", "{{json .}}"], 10)
    try:
        full = json.loads(result.stdout)
        host = full["HostConfig"]
        config = full["Config"]
        python_environment = {}
        for item in config["Env"]:
            key, separator, value = item.partition("=")
            if separator and key in ("PYTHONDONTWRITEBYTECODE", "PYTHONNOUSERSITE"):
                python_environment.setdefault(key, []).append(value)
        return {"image_id": full["Image"],
                "network_mode": host["NetworkMode"], "read_only_rootfs": host["ReadonlyRootfs"],
                "user": config["User"], "cap_drop": host["CapDrop"],
                "security_opt": host["SecurityOpt"], "pids_limit": host["PidsLimit"],
                "memory_bytes": host["Memory"], "nano_cpus": host["NanoCpus"],
                "tmpfs": host["Tmpfs"], "privileged": host["Privileged"],
                "ulimits": host["Ulimits"], "publish_all_ports": host["PublishAllPorts"],
                "port_bindings": host["PortBindings"], "devices": host["Devices"],
                "device_requests": host["DeviceRequests"], "volumes_from": host["VolumesFrom"],
                "environment_names": sorted(value.split("=", 1)[0] for value in config["Env"]),
                "python_environment": python_environment,
                "mounts": sorted(
                    [{"destination": m["Destination"], "read_write": m["RW"], "type": m["Type"],
                      "source_sha256": sha(m["Source"].encode())}
                     for m in full["Mounts"]], key=lambda item: item["destination"]),
                "state_exit_code": full["State"]["ExitCode"]}
    except (KeyError, ValueError, TypeError) as exc:
        raise PairError("container_inspect_invalid") from exc


def validate_isolation(info: dict, expected_image_id: str,
                       expected_mount_sources: dict[str, str] | None = None) -> None:
    expected_mounts = [
        {"destination": "/harness.py", "read_write": False, "type": "bind"},
        {"destination": "/site", "read_write": False, "type": "bind"},
        {"destination": "/source", "read_write": False, "type": "bind"}]
    if expected_mount_sources is not None:
        if set(expected_mount_sources) != {item["destination"] for item in expected_mounts}:
            raise PairError("container_isolation_mismatch")
        for item in expected_mounts:
            item["source_sha256"] = expected_mount_sources[item["destination"]]
    if (info["image_id"] != expected_image_id
            or info["network_mode"] != "none" or info["read_only_rootfs"] is not True
            or info["user"] != "65534:65534" or info["cap_drop"] != ["ALL"]
            or "no-new-privileges=true" not in (info["security_opt"] or [])
            or info["pids_limit"] != 64 or info["memory_bytes"] != 268435456
            or info["nano_cpus"] != 1_000_000_000
            or info["tmpfs"] != {"/tmp": "rw,noexec,nosuid,nodev,size=32m"}
            or info["privileged"] is not False
            or info["ulimits"] != [{"Name": "nofile", "Hard": 64, "Soft": 64}]
            or info["publish_all_ports"] is not False
            or info["port_bindings"] not in (None, {})
            or info["devices"] not in (None, [])
            or info["device_requests"] not in (None, [])
            or info["volumes_from"] not in (None, [])
            or info["python_environment"] != {
                "PYTHONDONTWRITEBYTECODE": ["1"], "PYTHONNOUSERSITE": ["1"]}
            or info["mounts"] != expected_mounts
            or info["state_exit_code"] != 0):
        raise PairError("container_isolation_mismatch")


def missing_container(result: subprocess.CompletedProcess[bytes], name: str) -> bool:
    return result.returncode != 0 and result.stderr.decode("utf-8", "replace").strip() in {
        f"Error response from daemon: No such container: {name}",
        f"Error: No such object: {name}", f"Error: No such container: {name}"}


def run_container(label: str, source: Path, site: Path, output: Path, runs: dict,
                  expected_image_id: str) -> dict:
    name = "vettalon-aiohttp-pair-" + uuid4().hex[:16]
    record = {"container_name": name, "exit_code": None, "timed_out": False,
              "timeout_seconds": 30, "cleanup_absent": False,
              "cleanup_remove_confirmed": False, "cells": {}}
    record["mount_source_sha256"] = {
        destination: sha(path.encode())
        for destination, path in mount_source_paths(source, site).items()}
    runs[label] = record
    stdout_path = output / f"{label}-stdout.raw"
    stderr_path = output / f"{label}-stderr.raw"
    try:
        capture = bounded_process(docker_args(label, source, site, name), stdout_path,
                                  stderr_path, timeout=30)
        record["exit_code"] = capture["exit_code"]
        record["capture_problem"] = capture["problem"]
        record["process_cleanup_error"] = capture["cleanup_error"]
        record["timed_out"] = capture["problem"] == "timeout"
        stdout, stderr = stdout_path.read_bytes(), stderr_path.read_bytes()
        for stream, data in (("stdout", stdout), ("stderr", stderr)):
            record[f"{stream}_sha256"] = sha(data)
            record[f"{stream}_bytes"] = len(data)
            if len(data) != capture[f"{stream}_bytes"] or len(data) > OUTPUT_CAP:
                raise PairError("container_capture_mismatch")
        if (record["capture_problem"] or record["process_cleanup_error"]
                or record["exit_code"] != 0 or stderr):
            raise PairError("container_execution_failed")
        try:
            observation = json.loads(stdout)
            version = MANIFEST["packages"]["aiohttp-3.9.1" if label == "weak" else "aiohttp-3.9.2"]["version"]
            if observation["version"] != version:
                raise PairError("source_version_mismatch")
            if set(observation["cells"]) != set(REQUESTS):
                raise PairError("cells_missing")
            for cell_name, cell in observation["cells"].items():
                request = base64.b64decode(cell["request_b64"], validate=True)
                raw = base64.b64decode(cell["response_b64"], validate=True)
                if (sha(request) != cell["request_sha256"] or sha(raw) != cell["response_sha256"]
                        or len(raw) != cell["response_bytes"]):
                    raise PairError("cell_digest_mismatch")
                (output / f"{label}-{cell_name}-request.http").write_bytes(request)
                (output / f"{label}-{cell_name}-response.http").write_bytes(raw)
                record["cells"][cell_name] = {**validate_cell(label, cell_name, request, raw),
                    "request_sha256": sha(request), "request_bytes": len(request),
                    "response_sha256": sha(raw), "response_bytes": len(raw)}
        except (KeyError, ValueError, TypeError, UnicodeError) as exc:
            raise PairError("container_output_invalid") from exc
    finally:
        try:
            record["container_inspection"] = inspect_container(name)
        except (PairError, subprocess.TimeoutExpired):
            record["inspect_error"] = "container_inspect_failed"
        try:
            removal = bounded_command(["docker", "rm", "-f", name], timeout=10)
            record["cleanup_remove_exit_code"] = removal.returncode
            record["cleanup_remove_confirmed"] = removal.returncode == 0 or missing_container(removal, name)
        except PairError:
            record["cleanup_error"] = "cleanup_remove_capture_failed"
        try:
            post = bounded_command(["docker", "container", "inspect", name], timeout=10)
            record["cleanup_absent"] = record.get("cleanup_remove_confirmed", False) and missing_container(post, name)
        except PairError:
            record["cleanup_error"] = "cleanup_post_inspect_capture_failed"
    if record.get("inspect_error") or not record["cleanup_absent"]:
        raise PairError("container_inspection_or_cleanup_failed")
    validate_isolation(record["container_inspection"], expected_image_id,
                       record["mount_source_sha256"])
    record["validated"] = True
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--package-dir", type=Path, help="Pre-fetched complete files; each hash is checked")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=False)
    receipt = {"schema": "aiohttp-paired-receipt-v1", "status": "incomplete",
               "started_utc": datetime.now(timezone.utc).isoformat(),
               "scope": "local raw HTTP only; no symlinks; no Vettalon detection claim",
               "manifest_sha256": sha(MANIFEST_PATH.read_bytes()),
               "harness_sha256": sha((BASE / "harness.py").read_bytes()),
               "runner_sha256": sha((BASE / "run_pair.py").read_bytes()),
               "image": IMAGE, "packages": {}, "runs": {}, "error": None}
    try:
        with tempfile.TemporaryDirectory(prefix="vettalon-aiohttp-pair-") as temporary:
            stage = Path(temporary)
            stage.chmod(0o755)
            package_data = {}
            for name, entry in MANIFEST["packages"].items():
                package_data[name] = read_package(entry, args.package_dir)
                receipt["packages"][name] = {"filename": entry["filename"],
                    "sha256": sha(package_data[name]), "bytes": len(package_data[name]),
                    "url": entry["url"]}
            image = command(["docker", "image", "inspect", IMAGE, "--format",
                             "{{json .RepoDigests}}|{{.Id}}|{{.Architecture}}"], 15)
            fields = image.stdout.decode().strip().split("|", 2)
            if (len(fields) != 3 or IMAGE not in json.loads(fields[0])
                    or fields[1] != MANIFEST["image_id_arm64"]
                    or fields[2] != MANIFEST["image_arch"]):
                raise PairError("image_digest_or_arch_mismatch")
            receipt["image_local"] = {"id": fields[1], "architecture": fields[2]}
            site = stage / "site"
            site.mkdir()
            receipt["dependencies"] = extract_wheels(
                {key: value for key, value in package_data.items() if not key.startswith("aiohttp-")}, site)
            make_readable(site)
            for label, version in (("weak", "3.9.1"), ("fixed", "3.9.2")):
                source_stage = stage / label
                source_stage.mkdir()
                receipt.setdefault("sources", {})[label] = extract_sdist(
                    package_data[f"aiohttp-{version}"], source_stage, version)
                make_readable(source_stage)
                run_container(label, source_stage / f"aiohttp-{version}", site, output,
                              receipt["runs"], receipt["image_local"]["id"])
            receipt["status"] = "pass_paired_property"
    except PairError as exc:
        receipt["error"] = str(exc)
    except Exception as exc:
        receipt["error"] = f"internal_error:{type(exc).__name__}"
    finally:
        receipt["finished_utc"] = datetime.now(timezone.utc).isoformat()
        (output / "receipt.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"status": receipt["status"], "error": receipt["error"],
                      "receipt": str(output / "receipt.json")}, sort_keys=True))
    return 0 if receipt["status"] == "pass_paired_property" else 1


if __name__ == "__main__":
    sys.exit(main())
