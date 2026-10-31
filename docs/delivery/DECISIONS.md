# Decisions and assumptions

Status is `proposed`, `approved`, `rejected` or `superseded`. A proposed default allows a reversible prototype or design investigation, not an irreversible production commitment. Record decision date, approving person, rationale and affected requirements when approved.

| ID | Decision | Proposed default | Status | Needed by | Accountable approver |
| --- | --- | --- | --- | --- | --- |
| D01 | Initial market | Philippines; PHP; Asia/Manila; English with localization support | proposed | S01 | Product sponsor |
| D02 | Tenant boundary | One legal association per tenant; explicit management company memberships | proposed | S01 | Product sponsor and architecture lead |
| D03 | Hosting and data residency | Managed shared service; assess Supabase and Cloud Run cost, regions and recovery guarantees | proposed | S01 | Architecture, privacy and operations owners |
| D04 | Android implementation | Compare Kotlin Compose and React Native with auth, push, uploads and device spike | proposed | S01 recommendation; S06 approval | Product and engineering leads |
| D05 | Android device support | Android 10 onward subject to actual device survey and current store requirements | proposed | S06 | Product owner |
| D06 | Finance policy | Manual payment verification first; tenant-approved rounding, allocation, approval limits and document terminology | proposed | S04 production policy | Association finance owner |
| D07 | Security and staff identity | MFA for privileged roles; approved support access; shared-device policy | proposed | S02 | Security and operations owners |
| D08 | Privacy and retention | Data inventory and tenant notices; explicit schedules and legal holds; specialist validation | proposed | S05 and before real onboarding | Privacy owner |
| D09 | Service targets | BRD NFR targets are internal proposals until cost and load evidence support them | proposed | S10 | Sponsor and operations owner |
| D10 | Pilot and phasing | Release A core web plus resident Android; Release B guard and extended operations; one village and condo pilot | proposed | S00 planning; S11 launch | Product and pilot sponsors |
| D11 | Subscription lifecycle | Platform fees distinct from dues; no commercial billing engine in initial scope | proposed | Before commercialization | Sponsor |

## Decision record template
ID and title / status / date / actual approver / context / options / decision / rationale / BRD IDs / affected data and compatibility / reversal plan / links to evidence.

Unapproved decisions must remain visibly proposed. Where a decision blocks a sprint, mark `blocked` with the exact decision ID; complete independent work without inventing approval.
