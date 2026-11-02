# Sprint roadmap

Each sprint is a bounded delivery package, not a fixed duration. The implementing agent works on one at a time; split further if its work exceeds reviewable size. Engineering ready_for_review is separate from business acceptance. Start no dependent sprint before the predecessor is accepted with actual owner approval recorded; never treat this roadmap as approval to publish or deploy.

| Sprint | Delivery package | Depends on |
| --- | --- | --- |
| [S00](sprints/S00.md) | Reproducible foundation and demo containment | None |
| [S01](sprints/S01.md) | Tenant domain and architecture | S00 |
| [S02](sprints/S02.md) | Real identity and tenant authorization | S01 |
| [S03](sprints/S03.md) | Onboarding and property membership workflows | S02 |
| [S04](sprints/S04.md) | Receivables and payment verification | S03 |
| [S05](sprints/S05.md) | Core resident services and private documents | S04 |
| [S08](sprints/S08.md) | Visitor and guard operations | S05 |
| [S09](sprints/S09.md) | Parking pets amenities and condominium moves | S08 |
| [S10](sprints/S10.md) | Production hardening and operating readiness | S09 |
| [S11](sprints/S11.md) | Web village and condominium pilot acceptance | S10 |
| [S06](sprints/S06.md) | Post-S11 commercial Android foundation and account context | S11 |
| [S07](sprints/S07.md) | Post-S11 commercial resident Android workflows and cross-channel parity | S06 |

Approved web-first sequence (Jerome Gotangco, 2 November 2026): S00–S05 → S08 → S09 → S10 → S11 → S06 → S07. Stable sprint IDs are retained; `STATUS.json.delivery_order` records execution order separately from numeric identity. S06/S07 remain not_started and require accepted S11 pilot evidence plus explicit commercial/license, stack and device decisions before selection.

Release A core web spans S00–S05. S08–S09 implement Release B web/guard operations; S10–S11 harden and pilot the web platform. Android and any future iOS app are unnecessary for the initial pilot or first commercial web release. Enabled gate modules still require G7. All security, finance, recovery, privacy and web usability gates remain binding. No rollout is authorized by the sequence change.

Current accepted baseline: S00–S02 through PR #1, PR #2 and PR #3. S03 is in progress; its reviewed increment does not complete all sprint acceptance. Consult `STATUS.json` and sprint evidence for authoritative state; a documentation update does not authorize the next sprint.

## State meanings
- not_started: no implementation evidence.
- in_progress: active selected scope.
- blocked: exact missing decision, environment or external input recorded.
- ready_for_review: engineering checks demonstrated; owner acceptance pending.
- accepted: actual owner approval recorded with evidence, date and identity.

The planning checker validates structure, coverage and ordering. It does not execute the application or prove any acceptance statement.

## Future planning beyond S11

[Post-S11 candidates](POST_S11.md) records future extensions, intended commercial/mobile boundaries and an explicit S11 acceptance/pilot-evidence gate. No candidate is approved for implementation. The sponsor approved moving Android after S11 on 2 November 2026. This roadmap, BRD, sprint prompts and machine-readable dependencies now reflect that change; all other candidate implementation remains unapproved.
