"""Guardrails for source pinning, semantic denominators and sandbox flags."""

import importlib.util
import io
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import time
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location("ammonia_pair", Path(__file__).with_name("run_pair.py"))
pair = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pair)


def output(label: str, *, changed: str | None = None) -> tuple[bytes, bytes, int]:
    lines = ["running 5 tests"]
    for method in sorted(pair.METHODS):
        result = "FAILED" if label == "weak" and method in pair.WEAK_FAILED else "ok"
        if method == changed:
            result = "FAILED" if result == "ok" else "ok"
        lines.append(f"test test::policy_css_url_{method} ... {result}")
    lines.append("test result: FAILED. 3 passed; 2 failed; 0 ignored;" if label == "weak"
                 else "test result: ok. 5 passed; 0 failed; 0 ignored;")
    stderr = f"Compiling ammonia v{pair.MANIFEST['versions'][label]['version']} (/source)\n"
    return ("\n".join(lines) + "\n").encode(), stderr.encode(), 101 if label == "weak" else 0


class PairContracts(unittest.TestCase):
    def make_source(self, root: Path) -> Path:
        source = root / "source"
        (source / "src").mkdir(parents=True)
        for name in ("Cargo.toml", "Cargo.lock", "src/lib.rs", "src/style.rs",
                     "src/vettalon_policy_tests.rs"):
            path = source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(name.encode())
        return source

    def test_exact_five_and_normal_control(self):
        for label in ("weak", "fixed"):
            stdout, stderr, code = output(label)
            result = pair.parse_observation(label, stdout, stderr, code)
            self.assertEqual(result["normal_control"], "ok")
            with self.assertRaises(pair.PairError):
                pair.parse_observation(label, *output(label, changed="https_control"))

    def test_inverted_security_result_rejected(self):
        stdout, stderr, code = output("weak", changed="http_upper_denied")
        with self.assertRaises(pair.PairError):
            pair.parse_observation("weak", stdout, stderr, code)

    def test_version_compile_line_required(self):
        stdout, stderr, code = output("fixed")
        with self.assertRaises(pair.PairError):
            pair.parse_observation("fixed", stdout, b"", code)

    def test_source_insertion_is_additive_and_idempotence_fails(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary)
            (source / "src").mkdir()
            original = b"prefix\n#[cfg(test)]\nmod test {\n    use super::*;\n}\n"
            (source / "src/lib.rs").write_bytes(original)
            record = pair.stage_tests(source)
            self.assertEqual(record["original_lib_sha256"], pair.digest(original))
            self.assertIn(b'include!("vettalon_policy_tests.rs");', (source / "src/lib.rs").read_bytes())
            with self.assertRaises(pair.PairError):
                pair.stage_tests(source)

    def test_network_none_and_readonly_source_mounts(self):
        args = pair.docker_args("vettalon-ammonia-pair-test", Path("/tmp/source"), Path("/tmp/vendor"))
        for flag in ("--network", "none", "--read-only", "--cap-drop", "ALL",
                     "--memory", "1536m", "--pids-limit", "128", "--pull=never"):
            self.assertIn(flag, args)
        self.assertEqual(args.count("--mount"), 2)
        self.assertEqual(sum("readonly" in arg for arg in args), 2)
        self.assertNotIn("--privileged", args)

    def test_docker_absence_requires_exact_known_response(self):
        name = "vettalon-ammonia-pair-test"
        missing = subprocess.CompletedProcess(["docker", "inspect"], 1, b"",
                                              f"error: no such object: {name}\n".encode())
        daemon_down = subprocess.CompletedProcess(["docker", "inspect"], 1, b"",
                                                  b"Cannot connect to the Docker daemon")
        self.assertTrue(pair.missing_container(missing, name))
        self.assertFalse(pair.missing_container(daemon_down, name))

    def test_stream_capture_stops_at_cap(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            result = pair.bounded_process(
                [sys.executable, "-c", "import sys; sys.stdout.write('X' * 400000); sys.stdout.flush()"],
                root / "stdout.raw", root / "stderr.raw", timeout=10)
            self.assertEqual(result["problem"], "output_cap")
            self.assertEqual((root / "stdout.raw").stat().st_size, pair.CAP)
            self.assertLessEqual((root / "stderr.raw").stat().st_size, pair.CAP)

    def test_orphan_holding_pipe_is_killed_on_timeout(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            marker = root / "orphan-survived"
            child = ("import pathlib,time; time.sleep(1.2); "
                     f"pathlib.Path({str(marker)!r}).write_text('alive')")
            parent = ("import subprocess,sys; "
                      f"subprocess.Popen([sys.executable, '-c', {child!r}]); "
                      "print('parent exited', flush=True)")
            result = pair.bounded_process([sys.executable, "-c", parent],
                                          root / "stdout.raw", root / "stderr.raw", timeout=0.2)
            self.assertEqual(result["problem"], "timeout")
            time.sleep(1.3)
            self.assertFalse(marker.exists())

    def test_output_readback_failure_still_removes_owned_container(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = self.make_source(root)
            output = root / "output"
            output.mkdir()
            calls = []
            original_digest = pair.file_digest
            digest_calls = 0

            def flaky_digest(path):
                nonlocal digest_calls
                digest_calls += 1
                if digest_calls == 6:
                    raise OSError("injected readback error")
                return original_digest(path)

            def fake_bounded(_args, stdout_path, stderr_path, **_kwargs):
                stdout_path.write_bytes(b"good")
                stderr_path.write_bytes(b"")
                return {"exit_code": 0, "problem": None}

            def fake_run(args, **_kwargs):
                calls.append(args)
                if args[1:3] == ["rm", "-f"]:
                    return subprocess.CompletedProcess(args, 0, b"", b"")
                return subprocess.CompletedProcess(args, 1, b"",
                                                   f"error: no such object: {args[-1]}\n".encode())

            runs = {}
            with patch.object(pair, "file_digest", side_effect=flaky_digest), \
                 patch.object(pair, "bounded_process", side_effect=fake_bounded), \
                 patch.object(pair, "parse_observation", return_value={}), \
                 patch.object(pair.subprocess, "run", side_effect=fake_run):
                with self.assertRaises(pair.PairError):
                    pair.run_arm("fixed", source, root, output, runs)
            self.assertTrue(runs["fixed"]["cleanup_absent"])
            self.assertEqual(runs["fixed"]["readback_error"], "output_or_source_readback_failed")
            self.assertTrue(any(args[1:3] == ["rm", "-f"] for args in calls))

    def test_capture_overflow_still_removes_owned_container(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = self.make_source(root)
            output = root / "output"
            output.mkdir()
            calls = []

            def fake_bounded(_args, stdout_path, stderr_path, **_kwargs):
                stdout_path.write_bytes(b"X" * pair.CAP)
                stderr_path.write_bytes(b"")
                return {"exit_code": -15, "problem": "output_cap"}

            def fake_run(args, **_kwargs):
                calls.append(args)
                if args[1:3] == ["rm", "-f"]:
                    return subprocess.CompletedProcess(args, 0, b"", b"")
                return subprocess.CompletedProcess(args, 1, b"",
                                                   f"error: no such object: {args[-1]}\n".encode())

            runs = {}
            with patch.object(pair, "bounded_process", side_effect=fake_bounded), \
                 patch.object(pair, "inspect_container", side_effect=pair.PairError("not available")), \
                 patch.object(pair.subprocess, "run", side_effect=fake_run):
                with self.assertRaisesRegex(pair.PairError, "fixed_output_cap"):
                    pair.run_arm("fixed", source, root, output, runs)
            self.assertEqual((output / "fixed.stdout.raw").stat().st_size, pair.CAP)
            self.assertEqual(runs["fixed"]["capture_problem"], "output_cap")
            self.assertTrue(runs["fixed"]["cleanup_absent"])

    def test_crate_normalized_member_path_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            bundle = io.BytesIO()
            with tarfile.open(fileobj=bundle, mode="w:gz") as archive:
                data = b"x"
                member = tarfile.TarInfo("ammonia-4.2.3/src//lib.rs")
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
            with self.assertRaises(pair.PairError):
                pair.unpack_crate(bundle.getvalue(), "4.2.3", Path(temporary) / "crate", "0" * 40)

    def test_vendor_normalized_member_path_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            payload = root / "vendor.tar"
            with tarfile.open(payload, mode="w") as archive:
                data = b"x"
                member = tarfile.TarInfo("vendor/pkg//file")
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
            expected = pair.file_digest(payload)
            with patch.dict(pair.MANIFEST, {"verified_local_vendor_payload_sha256": expected}):
                with self.assertRaises(pair.PairError):
                    pair.extract_pinned_vendor(payload, root / "extracted")


if __name__ == "__main__":
    unittest.main()
