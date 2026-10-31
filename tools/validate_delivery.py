#!/usr/bin/env python3
"""Check planning consistency only; this does not validate the application."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQ = re.compile(r"\b(?:SCP|TEN|IAM|FIN|OPS|UX|AND|NFR|REL|PRV|ARC) \d{2}\b")
STATES = {"not_started", "in_progress", "blocked", "ready_for_review", "accepted"}


def validate(root):
    errors = []

    def check(ok, message):
        if not ok:
            errors.append(message)

    def read(path):
        target = root / path
        check(target.is_file(), f"Missing file: {path}")
        return target.read_text(encoding="utf-8") if target.is_file() else ""

    required = ["AGENTS.md", "docs/START_HERE.md", "docs/BRD.md",
                "docs/antigravity/MASTER_PROMPT.md", "docs/antigravity/CONTINUE_PROMPT.md",
                "docs/delivery/BASELINE.md", "docs/delivery/DECISIONS.md",
                "docs/delivery/SPRINTS.md", "docs/delivery/ACCEPTANCE.md",
                "docs/delivery/evidence/TEMPLATE.md"]
    for path in required:
        check(bool(read(path).strip()), f"Empty required document: {path}")
    try:
        data = json.loads(read("docs/delivery/STATUS.json"))
    except (json.JSONDecodeError, OSError) as exc:
        return errors + [f"Cannot parse status: {exc}"]
    check(data.get("schema_version") == 1, "Unsupported status schema")
    sprints = data.get("sprints", [])
    if not isinstance(sprints, list) or not all(isinstance(s, dict) for s in sprints):
        return errors + ["sprints must be a list of objects"]
    ids = [s.get("id") for s in sprints]
    check(ids == [f"S{i:02d}" for i in range(12)], "Expected ordered unique sprints S00 through S11")
    by_id = {s.get("id"): s for s in sprints}
    check(data.get("current_sprint") in by_id, "Current sprint does not exist")
    for sprint in sprints:
        sid = sprint.get("id", "unknown")
        state = sprint.get("status")
        check(state in STATES, f"{sid}: invalid status")
        check(sprint.get("prompt") == f"docs/delivery/sprints/{sid}.md", f"{sid}: unexpected prompt path")
        check(sprint.get("evidence") == f"docs/delivery/evidence/{sid}.md", f"{sid}: unexpected evidence path")
        prompt = read(f"docs/delivery/sprints/{sid}.md")
        for heading in ["## Deliverables", "## Acceptance evidence", "## Exclusions", "## Handoff"]:
            check(heading in prompt, f"{sid}: missing {heading}")
        deps = sprint.get("depends_on", [])
        if not isinstance(deps, list):
            errors.append(f"{sid}: depends_on must be a list")
            continue
        for dep in deps:
            check(dep in by_id and dep != sid, f"{sid}: invalid dependency {dep}")
            if dep in ids and sid in ids:
                check(ids.index(dep) < ids.index(sid), f"{sid}: dependency must precede sprint")
            if state in {"in_progress", "ready_for_review", "accepted"}:
                check(by_id.get(dep, {}).get("status") == "accepted", f"{sid}: predecessor {dep} not accepted")
        if state in {"blocked", "ready_for_review", "accepted"}:
            evidence = read(f"docs/delivery/evidence/{sid}.md")
            check(bool(evidence.strip()), f"{sid}: evidence required for {state}")
        if state == "blocked":
            check(bool(sprint.get("blockers")), f"{sid}: blocked without a named blocker")
        if state == "accepted":
            check(bool(sprint.get("accepted_by")), f"{sid}: actual acceptance owner required")
            check(bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", sprint.get("accepted_at") or "")), f"{sid}: acceptance date must be YYYY-MM-DD")
        else:
            check(sprint.get("accepted_by") is None and sprint.get("accepted_at") is None,
                  f"{sid}: acceptance metadata on unaccepted sprint")
    requirements = set(REQ.findall(read("docs/BRD.md")))
    rows = []
    for line in read("docs/delivery/TRACEABILITY.md").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if cells and REQ.fullmatch(cells[0]):
            rows.append(cells)
    mapped = [r[0] for r in rows]
    check(len(mapped) == len(set(mapped)), "Duplicate traceability requirement")
    check(set(mapped) == requirements, f"Traceability mismatch: missing={sorted(requirements-set(mapped))}, extra={sorted(set(mapped)-requirements)}")
    for row in rows:
        check(len(row) == 3 and row[1] in by_id, f"Invalid traceability row: {row}")
    return errors


if __name__ == "__main__":
    try:
        problems = validate(ROOT)
    except (KeyError, TypeError, ValueError, OSError) as exc:
        problems = [f"Invalid planning data: {exc}"]
    for problem in problems:
        print("ERROR:", problem, file=sys.stderr)
    if problems:
        sys.exit(1)
    print("Planning structure valid: 12 sprints and complete BRD traceability. Application readiness is unverified.")
