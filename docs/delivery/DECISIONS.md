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
| D12 | Supported runtime baseline | Node.js 24 LTS, Next.js 16, React 19; mock-only demos; PostgreSQL 15 local validation | proposed | S00 | Architecture and engineering leads |

## Decision record template
ID and title / status / date / actual approver / context / options / decision / rationale / BRD IDs / affected data and compatibility / reversal plan / links to evidence.

### D12 Supported runtime and containment baseline
- Status: proposed for owner acceptance; engineering implementation is reviewable.
- Date: 2026-10-31.
- Actual approver: pending. No owner approval is claimed.
- Engineering selection: Node 24, Next.js 16.4.3, React 19.3.1, ESLint 10.14.0; exact dependency versions are locked. Webpack remains the build path for this existing project.
- Rationale: replace unsupported framework/runtime versions before building production features. Use the official Next and React lint plugins directly with compatible ESLint 10 instead of the preset that brings legacy peer ranges. Prototype-specific compiler lint exceptions are explicit in eslint.config.mjs.
- Demo boundary: synthetic in-memory UI only; no Supabase URL, public key or service key may be configured. Both application client factories are disabled. Production routes cannot reach mock operations, including authenticated sessions, until S02 adds trusted services.
- Alternatives: retaining Node 20 / Next 14 was rejected because they are unsupported. Connected hosted demos are deferred until separate accounts, credential boundaries and infrastructure isolation are designed and verified.
- BRD relationship: IAM 02 and REL 01 containment prerequisites. This does not complete real identity, tenant isolation, subscription lifecycle or any later-sprint requirement.
- Compatibility: Next proxy replaces middleware entry convention; clients and callback are explicitly disabled rather than maintaining dead identity integration.
- Sources and support dates: see BASELINE.md. Verification and remaining risks: evidence/S00.md.
- Rollback: revert only this feature branch change set in development. No production data or deployment was modified.

Unapproved decisions remain proposed. Engineering choices do not represent regulatory approval, product acceptance or authorization to deploy.


## S01 recommendations recorded 1 November 2026

D01: keep Philippines/PHP/Asia-Manila defaults configurable. D02: use association-scoped records with explicit memberships and composite foreign keys; business confirmation remains with the sponsor and architecture lead. See ADR 0001. D03: evaluate managed Supabase plus a container API/worker; no production region, purchased tier or recovery commitment selected. See ADR 0002. D04: evaluate Kotlin/Compose first for the Android-only goal, retain React Native as an alternative; device/build spike and actual owner approval remain required before S06. See ADR 0003. API evolution and migration compatibility are in ADR 0004.

These are engineering recommendations, not invented approvals. S01 may finish its reversible schema/testing scope while production hosting, legal onboarding rules and the mobile stack remain explicitly unresolved for their decision owners. S00's runtime and containment implementation was accepted through PR #1; it does not approve any later deployment or spending.
