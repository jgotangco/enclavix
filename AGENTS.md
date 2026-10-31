# Enclavix delivery instructions

Read `docs/START_HERE.md`, `docs/BRD.md`, `docs/delivery/SPRINTS.md`, `docs/delivery/STATUS.json`, and the selected sprint file before changing code. This file is repository guidance; an Antigravity prompt must explicitly request that it be read.

## Working boundaries
- Execute one selected sprint at a time. Do not implement later sprints to fill gaps.
- Use a dedicated feature branch. Preserve unrelated user work. Never force-push, deploy, touch live data, apply production migrations, or publish Android builds without explicit authorization.
- Never commit secrets, resident records, payment evidence, environment files or signing keys. Use synthetic fixtures. Service role credentials must never reach web or Android clients.
- Demo cookies, client role assertions, hidden menus and route middleware are not trusted authorization. Enforce identity, tenant membership and record access in trusted services and database/storage policies.
- Financial posts, access decisions and approval actions require durable state, idempotency, audit and negative tests. Never report a simulated operation as successful.
- Do not choose an unresolved high-impact decision silently. Record the blocker and work independently on unblocked tasks; ask only for the decision actually needed.
- Verify current official dependency and platform documentation before installing or upgrading. Keep locked dependencies and a supported runtime; do not assume historical version numbers remain secure.

## Sprint completion
Map work to stable BRD IDs. Run appropriate positive and negative tests, a clean build and relevant migration checks. Record exact commands, results, unrun checks and limitations in `docs/delivery/evidence/Sxx.md`. Update `STATUS.json`, `TRACEABILITY.md` and the decision log. Run `python3 tools/validate_delivery.py`.

A planning validation pass does not certify application security or completion. Mark a sprint `ready_for_review` after engineering verification; only record `accepted` after the named acceptance owner actually approves it. Never fabricate approvals or test results. Stop at the sprint boundary with a concise handoff, risks, and proposed next sprint. No automatic production rollout.
