# Continuing or repairing a sprint

## Start the next sprint
Continue Enclavix using AGENTS.md and docs/antigravity/MASTER_PROMPT.md. Selected sprint: SXX (replace this with the real ID). Read its sprint file and verify predecessor evidence and STATUS.json. Implement only that sprint. Do not assume an earlier ready_for_review status is an owner acceptance. Run relevant checks, update evidence and stop for review.

## Repair the current sprint
Continue selected sprint SXX. Read the latest evidence and my review comments. Fix only the identified issues and necessary related regressions. Preserve BRD requirements and tenant isolation. Rerun checks affected by the fixes, update evidence and status honestly, and stop for review. Do not skip failed checks or begin the next sprint.

## Independent review prompt
Review the selected sprint against its acceptance criteria, BRD IDs and AGENTS.md. Inspect actual diff and tests. Distinguish reproduced defects from hypotheses. Check authorization, cross-tenant references, concurrency, migrations, backward compatibility and visible error states. Report prioritized findings with file references. Do not edit or mark accepted unless I authorize that action.

## Sprint evidence handoff
Use docs/delivery/evidence/TEMPLATE.md. Keep approvals separate from engineering results. The product owner decides whether to accept, revise or split a sprint. Push or PR creation requires the user's requested collaboration workflow; production deployment always needs separate authorization.
