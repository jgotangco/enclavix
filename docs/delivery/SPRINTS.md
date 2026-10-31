# Sprint roadmap

Each sprint is a bounded delivery package, not a fixed duration. Antigravity implements one at a time; split further if its work exceeds reviewable size. Engineering ready_for_review is separate from business acceptance. Start no dependent sprint before the predecessor is accepted with actual owner approval recorded; never treat this roadmap as approval to publish or deploy.

| Sprint | Delivery package | Depends on |
| --- | --- | --- |
| [S00](sprints/S00.md) | Reproducible foundation and demo containment | None |
| [S01](sprints/S01.md) | Tenant domain and architecture | S00 |
| [S02](sprints/S02.md) | Real identity and tenant authorization | S01 |
| [S03](sprints/S03.md) | Onboarding and property membership workflows | S02 |
| [S04](sprints/S04.md) | Receivables and payment verification | S03 |
| [S05](sprints/S05.md) | Core resident services and private documents | S04 |
| [S06](sprints/S06.md) | Android foundation and account context | S05 |
| [S07](sprints/S07.md) | Resident Android workflows and cross-channel parity | S06 |
| [S08](sprints/S08.md) | Visitor and guard operations | S07 |
| [S09](sprints/S09.md) | Parking pets amenities and condominium moves | S08 |
| [S10](sprints/S10.md) | Production hardening and operating readiness | S09 |
| [S11](sprints/S11.md) | Village and condominium pilot acceptance | S10 |

Release A core web and Android implementation spans S00–S07. S08–S09 implement Release B. S10–S11 are shared production readiness and pilot gates. This conservative sequence validates all modules before full rollout; an earlier core-only pilot may branch after S07 only by formally re-scoping S10/S11 to disabled Release B modules and retaining all core security, recovery and finance gates. Record that change before execution.

## State meanings
- not_started: no implementation evidence.
- in_progress: active selected scope.
- blocked: exact missing decision, environment or external input recorded.
- ready_for_review: engineering checks demonstrated; owner acceptance pending.
- accepted: actual owner approval recorded with evidence, date and identity.

The planning checker validates structure, coverage and ordering. It does not execute the application or prove any acceptance statement.
