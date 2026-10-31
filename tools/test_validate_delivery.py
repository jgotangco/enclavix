"""Planning-validator regression checks. Run: python3 tools/test_validate_delivery.py."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from validate_delivery import ROOT, validate


class DeliveryValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / "docs", self.root / "docs")
        shutil.copy(ROOT / "AGENTS.md", self.root / "AGENTS.md")
        self.status = self.root / "docs/delivery/STATUS.json"

    def change_status(self, index, state):
        data = json.loads(self.status.read_text())
        data["sprints"][index]["status"] = state
        self.status.write_text(json.dumps(data))

    def test_valid_repository(self):
        self.assertEqual(validate(self.root), [])

    def test_dependency_must_be_accepted(self):
        self.change_status(1, "in_progress")
        self.assertTrue(any("predecessor" in e for e in validate(self.root)))

    def test_acceptance_needs_owner_and_evidence(self):
        self.change_status(0, "accepted")
        errors = validate(self.root)
        self.assertTrue(any("acceptance owner" in e for e in errors))
        self.assertTrue(any("Missing file" in e for e in errors))

    def test_requirement_must_be_mapped(self):
        trace = self.root / "docs/delivery/TRACEABILITY.md"
        trace.write_text(trace.read_text().replace("| IAM 02 | S02 | unverified |", ""))
        self.assertTrue(any("Traceability mismatch" in e for e in validate(self.root)))


if __name__ == "__main__":
    unittest.main()
