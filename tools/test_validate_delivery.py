"""Planning-validator regression checks. Run: python3 tools/test_validate_delivery.py."""
import json
import re
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
        # Regression fixtures must not depend on the real roadmap's current progress.
        data = json.loads(self.status.read_text())
        for sprint in data["sprints"]:
            sprint.update(status="not_started", blockers=[], accepted_by=None, accepted_at=None)
        self.status.write_text(json.dumps(data))

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
        (self.root / "docs/delivery/evidence/S00.md").unlink(missing_ok=True)
        self.change_status(0, "accepted")
        errors = validate(self.root)
        self.assertTrue(any("acceptance owner" in e for e in errors))
        self.assertTrue(any("Missing file" in e for e in errors))

    def test_web_first_order_keeps_mobile_after_pilot(self):
        data = json.loads(self.status.read_text())
        self.assertEqual(data["delivery_order"][-2:], ["S06", "S07"])
        self.assertEqual(data["sprints"][6]["depends_on"], ["S11"])
        self.assertEqual(data["sprints"][8]["depends_on"], ["S05"])
        self.assertEqual(validate(self.root), [])

    def test_delivery_order_rejects_missing_duplicate_and_out_of_order_sprints(self):
        original = json.loads(self.status.read_text())
        for order in [original["delivery_order"][:-1], original["delivery_order"][:-1] + ["S06"], [f"S{i:02d}" for i in range(12)]]:
            data = dict(original, delivery_order=order)
            self.status.write_text(json.dumps(data))
            self.assertTrue(validate(self.root))

    def test_mobile_cannot_start_without_pilot_acceptance(self):
        self.change_status(6, "in_progress")
        self.assertTrue(any("predecessor S11 not accepted" in e for e in validate(self.root)))

    def test_requirement_must_be_mapped(self):
        trace = self.root / "docs/delivery/TRACEABILITY.md"
        trace.write_text(re.sub(r"^\| IAM 02 \|.*\n", "", trace.read_text(), flags=re.MULTILINE))
        self.assertTrue(any("Traceability mismatch" in e for e in validate(self.root)))


if __name__ == "__main__":
    unittest.main()
