"""Negative controls for the pinned local aiohttp pair."""

import importlib.util
import copy
import errno
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location("aiohttp_pair", Path(__file__).with_name("run_pair.py"))
pair = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pair)


def raw(status: int, body: bytes) -> bytes:
    return (f"HTTP/1.1 {status} Test\r\nContent-Length: {len(body)}\r\n\r\n".encode() + body)


class PairTest(unittest.TestCase):
    def test_four_cells(self):
        for label in ("weak", "fixed"):
            pair.validate_cell(label, "normal", pair.REQUESTS["normal"], raw(200, pair.PUBLIC))
        pair.validate_cell("weak", "traversal", pair.REQUESTS["traversal"], raw(200, pair.MARKER))
        pair.validate_cell("fixed", "traversal", pair.REQUESTS["traversal"], raw(404, b"404: Not Found"))

    def test_marker_tamper_fails(self):
        with self.assertRaisesRegex(pair.PairError, "weak_marker_missing"):
            pair.validate_cell("weak", "traversal", pair.REQUESTS["traversal"], raw(200, b"other"))

    def test_normal_control_failure_fails(self):
        with self.assertRaisesRegex(pair.PairError, "normal_control_failed"):
            pair.validate_cell("fixed", "normal", pair.REQUESTS["normal"], raw(404, pair.PUBLIC))

    def test_request_tamper_fails(self):
        with self.assertRaisesRegex(pair.PairError, "request_tampered"):
            pair.validate_cell("weak", "traversal", b"GET / HTTP/1.1\r\n\r\n", raw(200, pair.MARKER))

    def test_truncated_http_fails(self):
        with self.assertRaisesRegex(pair.PairError, "http_body_truncated_or_extra"):
            pair.parse_response(b"HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nshort")

    def test_pinned_package_tamper_fails(self):
        name, entry = next(iter(pair.MANIFEST["packages"].items()))
        with tempfile.TemporaryDirectory() as temporary:
            (Path(temporary) / entry["filename"]).write_bytes(b"tampered")
            with self.assertRaisesRegex(pair.PairError, "pinned_package_hash_or_size_mismatch"):
                pair.read_package(entry, Path(temporary))

    def test_docker_request_has_isolation(self):
        args = pair.docker_args("weak", Path("/tmp/source"), Path("/tmp/site"), "case-test")
        for value in ("none", "--read-only", "65534:65534", "ALL", "no-new-privileges=true",
                      "--pids-limit", "--memory", "--tmpfs", "--pull", "never"):
            self.assertIn(value, args)
        self.assertEqual(args.count("--mount"), 3)

    def test_macos_var_alias_keeps_exact_docker_mount_spelling(self):
        source = Path("/var/folders/test/stage/aiohttp-3.9.1")
        site = Path("/var/folders/test/stage/site")
        paths = pair.mount_source_paths(source, site)
        args = pair.docker_args("weak", source, site, "case-test")
        self.assertEqual(paths["/source"], str(source))
        self.assertEqual(paths["/site"], str(site))
        self.assertIn(f"type=bind,src={source},dst=/source,readonly", args)
        self.assertIn(f"type=bind,src={site},dst=/site,readonly", args)
        self.assertEqual(pair.sha(paths["/source"].encode()), pair.sha(str(source).encode()))
        self.assertNotEqual(pair.sha(paths["/source"].encode()),
                            pair.sha(("/private" + str(source)).encode()))

    def test_observed_isolation_tamper_fails(self):
        root = Path(__file__).resolve().parents[3]
        receipt_path = root / "reports/evidence-acceptance/aiohttp-paired-20261019/run-06/receipt.json"
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        original = receipt["runs"]["weak"]["container_inspection"]
        image_id = receipt["image_local"]["id"]
        changes = {
            "image_id": "sha256:wrong", "privileged": True,
            "ulimits": [], "mounts": [], "network_mode": "bridge",
            "python_environment": {"PYTHONDONTWRITEBYTECODE": ["0"],
                                   "PYTHONNOUSERSITE": ["1"]},
        }
        for key, bad in changes.items():
            with self.subTest(key=key):
                changed = copy.deepcopy(original)
                changed[key] = bad
                with self.assertRaisesRegex(pair.PairError, "container_isolation_mismatch"):
                    pair.validate_isolation(changed, image_id)

    def test_mount_source_hashes_are_required_and_checked(self):
        root = Path(__file__).resolve().parents[3]
        receipt_path = root / "reports/evidence-acceptance/aiohttp-paired-20261019/run-06/receipt.json"
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        info = copy.deepcopy(receipt["runs"]["weak"]["container_inspection"])
        expected = {destination: pair.sha(source.encode()) for destination, source in (
            ("/harness.py", "/test/harness.py"), ("/site", "/test/site"),
            ("/source", "/test/source"))}
        for mount in info["mounts"]:
            mount["source_sha256"] = expected[mount["destination"]]
        pair.validate_isolation(info, receipt["image_local"]["id"], expected)
        info["mounts"][1]["source_sha256"] = "0" * 64
        with self.assertRaisesRegex(pair.PairError, "container_isolation_mismatch"):
            pair.validate_isolation(info, receipt["image_local"]["id"], expected)

    def test_inspection_records_mount_hash_without_host_path(self):
        root = Path(__file__).resolve().parents[3]
        receipt_path = root / "reports/evidence-acceptance/aiohttp-paired-20261019/run-06/receipt.json"
        info = json.loads(receipt_path.read_text(encoding="utf-8"))["runs"]["weak"]["container_inspection"]
        host_keys = ("network_mode", "read_only_rootfs", "cap_drop", "security_opt", "pids_limit",
                     "memory_bytes", "nano_cpus", "tmpfs", "privileged", "ulimits",
                     "publish_all_ports", "port_bindings", "devices", "device_requests",
                     "volumes_from")
        docker_keys = ("NetworkMode", "ReadonlyRootfs", "CapDrop", "SecurityOpt", "PidsLimit",
                       "Memory", "NanoCpus", "Tmpfs", "Privileged", "Ulimits",
                       "PublishAllPorts", "PortBindings", "Devices", "DeviceRequests",
                       "VolumesFrom")
        full = {"Image": info["image_id"],
                "HostConfig": {target: info[source] for source, target in zip(host_keys, docker_keys)},
                "Config": {"User": info["user"], "Env": ["PYTHONDONTWRITEBYTECODE=1",
                                                       "PYTHONNOUSERSITE=1"]},
                "Mounts": [{"Destination": item["destination"], "RW": item["read_write"],
                            "Type": item["type"], "Source": "/sensitive/local/path/" + str(index)}
                           for index, item in enumerate(info["mounts"])],
                "State": {"ExitCode": 0}}
        output = json.dumps(full).encode()
        with patch.object(pair, "command", return_value=subprocess.CompletedProcess([], 0, output, b"")):
            observed = pair.inspect_container("synthetic")
        self.assertNotIn("/sensitive/local/path", json.dumps(observed))
        for index, mount in enumerate(observed["mounts"]):
            self.assertEqual(mount["source_sha256"],
                             pair.sha(f"/sensitive/local/path/{index}".encode()))

    def test_timeout_is_incomplete_and_retains_record(self):
        calls = []

        def fake_run(args, **_):
            calls.append(args)
            if args[:3] == ["docker", "rm", "-f"]:
                return subprocess.CompletedProcess(args, 0, b"", b"")
            name = args[-1]
            return subprocess.CompletedProcess(args, 1, b"",
                f"Error response from daemon: No such container: {name}".encode())

        runs = {}
        with tempfile.TemporaryDirectory() as temporary:
            def fake_capture(_, stdout_path, stderr_path, **__):
                stdout_path.write_bytes(b"partial")
                stderr_path.write_bytes(b"")
                return {"exit_code": -9, "problem": "timeout", "cleanup_error": None,
                        "stdout_bytes": 7, "stderr_bytes": 0}

            with patch.object(pair, "bounded_process", side_effect=fake_capture):
                with patch.object(pair, "inspect_container", side_effect=pair.PairError("inspect_failed")):
                    with patch.object(pair, "bounded_command", side_effect=fake_run):
                        with self.assertRaisesRegex(pair.PairError, "container_execution_failed"):
                            pair.run_container("weak", Path(temporary), Path(temporary), Path(temporary),
                                               runs, "sha256:expected")
        self.assertTrue(runs["weak"]["timed_out"])
        self.assertEqual(runs["weak"]["stdout_bytes"], 7)
        self.assertTrue(any(args[:3] == ["docker", "rm", "-f"] for args in calls))

    def test_cleanup_capture_failure_is_incomplete_without_key_error(self):
        calls = []

        def fake_command(args, **_):
            calls.append(args)
            if args[:3] == ["docker", "rm", "-f"]:
                raise pair.PairError("capture_failed")
            name = args[-1]
            return subprocess.CompletedProcess(args, 1, b"",
                f"Error response from daemon: No such container: {name}".encode())

        def fake_capture(_, stdout_path, stderr_path, **__):
            stdout_path.write_bytes(b"partial")
            stderr_path.write_bytes(b"")
            return {"exit_code": -9, "problem": "timeout", "cleanup_error": None,
                    "stdout_bytes": 7, "stderr_bytes": 0}

        runs = {}
        with tempfile.TemporaryDirectory() as temporary:
            with patch.object(pair, "bounded_process", side_effect=fake_capture):
                with patch.object(pair, "inspect_container", side_effect=pair.PairError("inspect_failed")):
                    with patch.object(pair, "bounded_command", side_effect=fake_command):
                        with self.assertRaisesRegex(pair.PairError, "container_execution_failed"):
                            pair.run_container("weak", Path(temporary), Path(temporary), Path(temporary),
                                               runs, "sha256:expected")
        self.assertFalse(runs["weak"]["cleanup_remove_confirmed"])
        self.assertFalse(runs["weak"]["cleanup_absent"])
        self.assertEqual(runs["weak"]["cleanup_error"], "cleanup_remove_capture_failed")
        self.assertTrue(any(args[:3] == ["docker", "container", "inspect"] for args in calls))

    def test_real_bounded_capture_stops_oversize_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            result = pair.bounded_process(
                [sys.executable, "-c", "import sys; sys.stdout.buffer.write(b'x' * 4096)"],
                base / "stdout", base / "stderr", timeout=3, cap=1024)
            self.assertEqual(result["problem"], "output_cap")
            self.assertIsNone(result["cleanup_error"])
            self.assertEqual((base / "stdout").stat().st_size, 1024)

    def test_real_bounded_capture_stops_on_deadline(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            started = time.monotonic()
            result = pair.bounded_process(
                [sys.executable, "-c", "import time; time.sleep(5)"],
                base / "stdout", base / "stderr", timeout=0.1)
            self.assertEqual(result["problem"], "timeout")
            self.assertIsNone(result["cleanup_error"])
            self.assertLess(time.monotonic() - started, 2)

    def test_real_bounded_capture_accepts_completed_group(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            result = pair.bounded_process(
                [sys.executable, "-c", "print('completed')"],
                base / "stdout", base / "stderr", timeout=3)
            self.assertEqual(result["exit_code"], 0)
            self.assertIsNone(result["problem"])
            self.assertIsNone(result["cleanup_error"])
            self.assertEqual((base / "stdout").read_bytes(), b"completed\n")

    def test_live_same_group_child_with_denied_signal_fails_closed(self):
        script = (
            "import os, subprocess, sys; "
            "child = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(10)'], "
            "stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); "
            "print(os.getpgrp(), child.pid, flush=True)"
        )
        real_killpg = pair.os.killpg

        def denied_kill(pgid, number):
            if number == pair.signal.SIGKILL:
                raise PermissionError(errno.EPERM, "synthetic denied signal")
            return real_killpg(pgid, number)

        pgid = None
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            try:
                with patch.object(pair.os, "killpg", side_effect=denied_kill):
                    result = pair.bounded_process([sys.executable, "-c", script],
                                                  base / "stdout", base / "stderr", timeout=3)
                pgid = int((base / "stdout").read_text().split()[0])
                self.assertEqual(result["exit_code"], 0)
                self.assertIsNone(result["problem"])
                self.assertEqual(result["cleanup_error"], "process_group_still_present")
                real_killpg(pgid, 0)
            finally:
                if pgid is not None:
                    try:
                        real_killpg(pgid, pair.signal.SIGKILL)
                    except ProcessLookupError:
                        pass

    def test_bounded_command_caps_non_run_output(self):
        result = pair.bounded_command([sys.executable, "-c", "print('inspect')"], timeout=3)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, b"inspect\n")
        with self.assertRaisesRegex(pair.PairError, "capture_failed"):
            pair.bounded_command(
                [sys.executable, "-c", "import sys; sys.stdout.buffer.write(b'x' * 200000)"],
                timeout=3)


if __name__ == "__main__":
    unittest.main()
