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
| D07 | Security and staff identity | MFA for every staff/admin role; individual accounts; immediate revocation; explicitly approved time-limited support | approved | S02 | Security and operations owners |
| D08 | Privacy and retention | Data inventory and tenant notices; explicit schedules and legal holds; specialist validation | proposed | S05 and before real onboarding | Privacy owner |
| D09 | Service targets | BRD NFR targets are internal proposals until cost and load evidence support them | proposed | S10 | Sponsor and operations owner |
| D10 | Pilot and phasing | Web-first phasing per D15; Release B guard and extended operations; one village and condo pilot | proposed | S00 planning; S11 launch | Product and pilot sponsors |
| D11 | Subscription lifecycle | Platform fees distinct from dues; no commercial billing engine in initial scope | proposed | Before commercialization | Sponsor |
| D12 | Supported runtime baseline | Node.js 24 LTS, Next.js 16, React 19; mock-only demos; PostgreSQL 15 local validation | proposed | S00 | Architecture and engineering leads |
| D13 | Onboarding approval | Operator creates; nominated administrator completes; a different operator independently verifies and activates | approved | S03 | Sponsor |
| D14 | Post-S11 candidates and commercial boundary | Future register; MIT core web; future mobile licensing choices; no candidate implementation approval | proposed | After S11 acceptance and pilot evidence | Sponsor |
| D15 | Web-first pilot and Android deferral | S00–S05 → S08–S11 → S06–S07; web pilot requires no mobile app | approved | Current planning baseline | Jerome Gotangco |

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

## D07 security policy approval — 2 November 2026

Approved by Jerome Gotangco through the explicit response “Use this policy”: MFA for all staff and administrator roles, no shared staff accounts, immediate membership revocation, support disabled until explicitly approved and time-limited. ADR 0005 defines the reviewable implementation (8-hour resident, 1-hour staff, 30-minute guard absolute sessions; sensitive changes within 10 minutes; support at most 60 minutes, metadata only). Implementation details require engineering review; production infrastructure and deployment remain unapproved.

## D13 onboarding approval flow — 2 November 2026

Approved by Jerome Gotangco through “Use this approval flow”: a registered platform operator creates the HOA setup, the nominated administrator completes it, and a different operator verifies the authority evidence and activation checklist. Neither creator nor nominee can self-activate. The implementation remains synthetic-only; approval to use real resident data, privacy/retention policy and production deployment are separate and remain pending. Any setup mutation invalidates an onboarding submission; activation binds to the reviewed revision and recomputes its checklist under the association lock. See evidence/S03.md.

## D14 post-S11 candidates and intended license boundary — 2 November 2026

Recorded at Jerome Gotangco's explicit request: [POST_S11.md](POST_S11.md) contains future candidates only. Documentation is authorized; their implementation, vendors, commercial license and schedule are not approved. Every candidate requires S11 acceptance, pilot evidence and a separate implementation decision. No late-S04 reconciliation-engine exception is authorized. At initial recording, S03–S11 scope, dependencies and acceptance criteria were unchanged. D15 subsequently approves the specific mobile/web-first rebaseline; existing non-mobile baseline obligations are not deferred by listing extensions.

The core web platform through S11 remains MIT: S00–S02 foundation/identity/authorization/audit; S03 onboarding/membership; S04 receivables/payment verification; S05 resident services/documents; core data model and S08–S09 web visitor/gate/basic parking/pet/amenity flows; S10 hardening; S11 pilot acceptance. The current LICENSE and existing MIT grants/notices are unchanged.

Initial direction (mobile timing superseded by approved D15 below): Android (currently S06–S07) and future iOS are commercial / post-MIT decision items, intended outside the MIT core web scope and unnecessary for the initial pilot or first commercial web release. On 2 November the sponsor specifically asked for a recommendation on moving Android after S11; this is recorded as a proposed rebaseline, not permission to change the roadmap. Formal adoption must consistently update Android timing, S08 dependencies and release/pilot criteria. Existing S06–S07 definitions remain authoritative until that decision. “Post-MIT” does not revoke existing MIT permissions or automatically create a commercial exception in this repository.

After pilot acceptance and before broader commercial launch, decide whether the overall offering/new differentiators continue MIT, use dual licensing, source-available terms or proprietary licensing, while respecting the core MIT boundary and existing grants. Future mobile/new differentiator licensing requires a separately documented scope and actual license before differently licensed code is introduced. Post-S11 candidates are not required for pilot acceptance. No specific pilot association, provider purchase, implementation or deployment is approved.

## D15 web-first pilot and Android deferral — 2 November 2026

Approved by Jerome Gotangco through “OK proceed with these changes, review and merge PRs from S03 when necessary,” following the explicit recommended sequence S03 → S04 → S05 → S08 → S09 → S10 → S11, then commercial Android. This supersedes D14's pending timing proposal and D10's Android-dependent pilot phasing; D14's future feature/license choices and D04/D05 remain proposed.

Retain stable sprint IDs; STATUS.json delivery_order becomes S00–S05, S08–S11, S06–S07. S08 depends on S05; S06 depends on actual accepted S11 pilot evidence; S07 depends on S06. S06/S07 remain not_started and require separate commercial/license, stack/device and implementation decisions before selection. No iOS work is authorized.

Core MIT web and shared API deliverables stay in scope through S11. S05 owns web UX 01–03; S07 later verifies Android equivalents and AND 01–04. G1/G4/G5 and S10/S11 now require web build, resident/staff web workflows and web release/operating evidence; no mobile build, store package or Android/web parity is a prerequisite for the pilot or first commercial web release. API/tenant isolation, live revocation, web accessibility, reconciled finance, privacy, restore and enabled gate controls remain mandatory. No security or operating gate is waived by this timing change.

Reviewed PR merges are authorized when their engineering checks pass. Merge of an S03 increment is not automatic completion of the whole sprint, owner UAT, real-data approval or production deployment. No later sprint or post-S11 candidate implementation is authorized by this decision. Reversal requires another explicit roadmap/BRD decision, not renumbering historical sprint evidence.

## S03 owner acceptance and next session — 2 November 2026

Jerome Gotangco explicitly confirmed “Review completed and accepted,” accepting the bounded S03 delivery after PR #4/#6 and the recorded engineering checks. Record S03 as accepted with the actual approver/date, update the README and delivery records on GitHub, and include clearly labeled actual web imagery and an optional planned Android illustration. Existing MIT licensing and post-S11 mobile decisions are unchanged. S03 closes tonight; S04 is planned for 3 November 2026 (Asia/Manila) and remains not_started until then. This does not authorize live data, production deployment, a mobile release or implementation of future candidates.

## Post-S11 installation candidate — 2 November 2026

Jerome Gotangco asked for an easier installation experience and explicitly placed it after S11. Recorded as [P19 in POST_S11.md](POST_S11.md): simple hosted onboarding and an optional guided self-hosted package, with configuration/health checks, secure bootstrap, upgrades and database-plus-attachment recovery. Hosted-first is an engineering recommendation, not an approved deployment or vendor choice. D03, support/distribution decisions and future mobile licensing remain unresolved as recorded. Existing S10/S11 deployment/recovery obligations remain binding. Documentation only; no implementation or current sprint changes are approved. S03 remains accepted and S04 remains not_started for the planned 3 November session.

## D06 synthetic implementation defaults — 3 November 2026

Jerome Gotangco explicitly approved “Use these synthetic defaults”: exact decimals, half-up rounding to two places per charge; explicit payment allocations and unapplied overpayments held as credit; different preparer and approver with no self-approval; tenant-set approval limits; numbered “payment acknowledgments”, without official tax receipt claims. This approves configurable synthetic S04 implementation, not any association's production accounting policy. D06 remains proposed for each association finance owner's real-use approval. No monetary approval limit, real funds, tax treatment, hosting or deployment is approved by this decision.

## S04 acceptance and S05 selection

On 7 November 2026, Jerome Gotangco authorized S04 acceptance, merge of PR #9 and continuation into S05. S04 merged as `53aff7d`. S05 begins with immediate scoped announcements. Existing privacy and retention decisions remain proposed.
