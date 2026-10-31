# Start here

Enclavix is being refreshed into a production web and Android service for independent village and condominium associations. The checked-in application remains a prototype. S00 foundation repairs are ready for review; the application remains a contained prototype, not a production service.

## Reading order
1. `docs/BRD.md` — business outcomes and stable requirement IDs.
2. `docs/delivery/BASELINE.md` — confirmed source issues and scope limits.
3. `docs/delivery/DECISIONS.md` — assumptions, proposed defaults and unresolved choices.
4. `docs/delivery/SPRINTS.md` and `STATUS.json` — delivery order and actual state.
5. `docs/antigravity/MASTER_PROMPT.md` and the selected file in `docs/delivery/sprints/`.
6. `docs/delivery/TRACEABILITY.md` and `docs/delivery/ACCEPTANCE.md`.

## Development handoff
Codex completed the S00 engineering checks on the feature branch. Owner acceptance remains pending. Read `AGENTS.md`, the selected sprint and its evidence before continuing. `docs/development.md` documents local setup and containment. The Antigravity prompts remain available for any future handoff.

Run `python3 tools/validate_delivery.py` from the repository root to validate planning structure. Python 3.9 or later is sufficient; no packages or application credentials are needed. App checks are added and executed by Antigravity in S00 and later sprints.

Run `python3 tools/test_validate_delivery.py` for the planning checker's regression tests. These tests validate documentation controls, not application behavior.

Use one reviewed change set per sprint; split large sprints further if needed. The roadmap does not imply fixed two-week estimates. Village and condominium UAT, legal and accounting policy choices, budgets and service targets still need accountable owner approval.

## Document authority
Current approved user instructions take precedence. The new BRD defines product intent; approved decision records refine implementation; sprint instructions define the current work boundary. Conflicts require explicit resolution and a documented change. `ENCLAVIX_SDD.md` and `PERSONA_OPERATIONS_MANUAL.md` describe the historical prototype and are not proof of production capabilities.
