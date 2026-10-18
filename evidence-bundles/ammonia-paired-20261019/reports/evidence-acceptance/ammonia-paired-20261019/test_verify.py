"""Mutation checks for the archived, independent readback."""

import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("ammonia_readback", HERE / "verify.py")
readback = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(readback)
RAW = ("receipt.json", "weak.stdout.raw", "weak.stderr.raw", "fixed.stdout.raw", "fixed.stderr.raw",
       "official-tags.raw", "official-tags.receipt.json")


class ArchivedReadbackTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="ammonia-readback-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        for name in RAW:
            shutil.copyfile(HERE / name, self.root / name)

    def receipt(self):
        return json.loads((self.root / "receipt.json").read_text())

    def save(self, receipt):
        (self.root / "receipt.json").write_text(json.dumps(receipt))

    def test_archived_pair_passes(self):
        self.assertEqual(readback.verify(self.root)["status"], "verified")

    def test_mutated_raw_fails(self):
        path = self.root / "weak.stdout.raw"
        path.write_bytes(path.read_bytes().replace(b"http_upper_denied", b"http_upper_accept"))
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_mutated_raw_with_updated_digest_still_fails_semantics(self):
        path = self.root / "fixed.stdout.raw"
        path.write_bytes(path.read_bytes().replace(b"https_control ... ok", b"https_control ... FAILED"))
        receipt = self.receipt()
        receipt["runs"]["fixed"]["stdout_sha256"] = readback.sha256(path.read_bytes())
        receipt["runs"]["fixed"]["stdout_bytes"] = path.stat().st_size
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_missing_raw_fails(self):
        (self.root / "weak.stderr.raw").unlink()
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_source_pin_fails(self):
        receipt = self.receipt()
        receipt["sources"]["weak"]["members"]["src/style.rs"] = "0" * 64
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_runner_pin_fails(self):
        receipt = self.receipt()
        receipt["runner_sha256"] = "0" * 64
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_network_claim_fails(self):
        receipt = self.receipt()
        receipt["runs"]["fixed"]["container_policy"]["network"] = "bridge"
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_cleanup_claim_fails(self):
        receipt = self.receipt()
        receipt["runs"]["weak"]["cleanup_absent"] = False
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_capture_problem_fails(self):
        receipt = self.receipt()
        receipt["runs"]["weak"]["capture_problem"] = "output_cap"
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_cleanup_remove_exit_fails(self):
        receipt = self.receipt()
        receipt["runs"]["weak"]["cleanup_remove_exit_code"] = 1
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_readback_error_fails(self):
        receipt = self.receipt()
        receipt["runs"]["weak"]["readback_error"] = "output_or_source_readback_failed"
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_cleanup_remove_error_fails(self):
        receipt = self.receipt()
        receipt["runs"]["weak"]["cleanup_remove_error"] = "docker_remove_failed"
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_cleanup_post_inspect_error_fails(self):
        receipt = self.receipt()
        receipt["runs"]["weak"]["cleanup_post_inspect_error"] = "docker_post_inspect_failed"
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_normal_control_claim_fails(self):
        receipt = self.receipt()
        receipt["runs"]["fixed"]["observation"]["normal_control"] = "unknown"
        self.save(receipt)
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_unexpected_file_fails(self):
        (self.root / "unaccounted.txt").write_text("surprise")
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)

    def test_tag_readback_change_fails(self):
        path = self.root / "official-tags.raw"
        path.write_bytes(path.read_bytes().replace(b"61fd35d3", b"00000000"))
        with self.assertRaises(readback.VerificationError):
            readback.verify(self.root)


if __name__ == "__main__":
    unittest.main()
