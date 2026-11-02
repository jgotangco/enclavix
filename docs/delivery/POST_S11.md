# Post-S11 candidate features

Recorded 2 November 2026 at Jerome Gotangco's request. Status: future planning only, not approved for implementation. This register adds no BRD acceptance criteria, sprint deliverables, launch promises or approved vendors. S03–S11, their dependencies, and their acceptance criteria remain unchanged.

## Entry gate and scope conflicts

Every candidate below is outside the current S03–S11 implementation scope. Start none of this candidate work until S11 has actual owner acceptance and pilot evidence exists, followed by explicit prioritization, scope and implementation approval. Suggested sequencing is relative, not a new sprint schedule or commitment.

Some candidates extend existing baseline requirements. Core documents, notifications, financial reporting, visitors, parking/pets/amenities and tenant exit controls already have obligations in the BRD and existing sprints. Their baseline obligations remain there; this register defers only the proposed extensions. It must not be used to remove required security, reporting, export or pilot controls.

Android is explicitly assigned to S06–S07 in the current roadmap and BRD. The sponsor's proposed commercial direction is to move Android, along with future iOS, after S11 and make mobile unnecessary for the initial pilot or first commercial web release. That direction is recorded here as a proposed rebaseline, not an enacted scope change: removing Android from S06–S07, changing S08's dependency, and revising release/pilot acceptance require an explicit, consistent roadmap/BRD decision. Until then, existing S06–S07 definitions and acceptance gates remain authoritative. No mobile work is authorized by this register.

The reconciliation engine candidate has no late-S04 exception. Although an earlier option mentioned late S04, the current instruction places these candidates beyond S11 and leaves S03–S11 unchanged.

## Common architecture and operating boundaries

Each candidate must respect the [tenant boundary](../architecture/adr/0001-tenant-boundary.md), [shared API and migration contract](../architecture/adr/0004-api-and-migrations.md), [identity and authorization model](../architecture/adr/0005-identity-and-access.md), and [outbox/private document boundaries](../architecture/workers-and-storage.md). Existing and subsequently accepted controls remain binding:

- Verified identity, explicit association/community/property authorization and effective-dated membership; live session and membership revocation; staff MFA and defined session lifetimes. A civic title, operator label, client claim or hidden menu grants no access.
- Tenant isolation, scoped references, RLS and default-deny services/storage. Every read, retrieval, external delivery and action must reauthorize its exact audience. A new provider or client must not receive privileged database credentials.
- Durable actor/tenant attribution, audit, idempotency and reviewed approval requirements. External outputs and callbacks do not become trusted financial or access decisions merely because they arrived successfully.
- The existing outbox and retry/deduplication model for asynchronous delivery. Respect consent, preferences and accepted retention/privacy rules. Auditability does not authorize indefinite retention or unnecessary disclosure of resident data.
- Proven core records and pilot evidence before extension. Review cost, support burden, privacy, provider terms and failure/manual fallback behavior before implementation approval. No particular provider, model, price, mobile stack or commercial license is selected here.

## Suggested sequencing

1. After acceptance, prioritize small extensions of accepted surfaces: document acknowledgment, accountant export, dues transparency and narrow document search.
2. Extend resident/guard/board workflows where pilot evidence supports them: recurring passes, incident logs, reporting, booking/registry improvements, emergency acknowledgments, operator context and exit packaging.
3. Consider external integrations and broader products only after operational capacity and explicit decisions: WhatsApp/Viber delivery, verified payment status, reconciliation import, full AI concierge and separately scoped commercial mobile apps.

Candidates can be reordered or declined. None is necessary for pilot acceptance merely because it appears here.

## P01 · AI Concierge — resident one-to-one

**Description:** A real AI agent using a lightweight, low-cost Flash-class API (Gemini Flash or equivalent, subject to later selection). Retrieval-first answers must cover HOA house rules, regulations and pertinent community rules/processes from authorized documents and published materials. Access is restricted to the authenticated resident's authorized statements, documents, visitor passes, announcements and permitted community-wide materials. Prefer short or no persistent conversational context to control cost.

**Dependencies and boundaries:** Post-S11 because documents, announcements, statements and tickets must first be proven in the pilot. Respect verified resident identity, current effective membership, tenant/property authorization, RLS/default deny and reauthorization of every retrieval/tool call. Record a full audit of prompts, tool calls and responses under approved access, redaction and retention rules; do not send secrets or unauthorized records to a model. Give an explicit consent notice before first use. Clear refusal boundaries must exist in both system instructions and trusted tools. The agent must identify itself as an AI at the start of every conversation or engagement. Operators/admins may assign a name, face or avatar only while its AI identity remains clear. Uncertain answers or requests requiring action must hand off to a private one-to-one staff chat or ticket with authorized, consented context. Community-wide communication stays in one-way broadcasts/announcements; no multi-user forum is proposed.

**Sequence:** Later, after narrow document search (P12) and proven human handoff/support capacity. No provider or autonomous financial/access action is approved.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P02 · Commercial mobile apps — Android and iOS

**Description:** Future native or cross-platform Android/iOS clients must reuse the resident API and authorization model used by the web portal. Android work referenced by S06–S07 and any future iOS app are intended as commercial / post-MIT decision items, outside the intended MIT core web scope; no stack is selected.

**Dependencies and boundaries:** Post-S11 commercial delivery would depend on proven web journeys, API stability and pilot evidence. Both clients must honor the same identity model, session lifetime, live revocation, tenant isolation, effective-dated membership, RLS/default deny and audited commands. A mobile client must never cache its way around revocation or acquire privileged backend credentials. Shared services remain part of the MIT core where already licensed that way. The sponsor's intended web-first release does not require Android or iOS for the initial pilot or first commercial web release; the explicit rebaseline described above is required to enact that intent without conflicting with current S06–S07 and pilot criteria.

**Sequence:** After S11, commercial/license decision and explicit roadmap rebaseline; Android first if pilot demand supports it, iOS later only if justified. No mobile implementation starts under this candidate.

**Scope:** This future commercial candidate is outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval. Existing S06–S07 scope is not silently rewritten.

## P03 · Verified payment status integration

**Description:** GCash, Maya or bank callbacks/deep links could supplement manual payment proof with verified external payment status. A deep link or client-reported success alone is not proof of settlement.

**Dependencies and boundaries:** Post-S11 because receivables, manual verification, reconciled ledger behavior and dispute handling must be proven first. Respect existing preparer/approver roles, tenant-bound references, RLS/default deny, financial audit and idempotent posting. Authenticate provider events, reconcile their meaning and handle retries/reversals under accepted finance controls. Use the outbox for related asynchronous notices; keep platform subscriptions separate from HOA dues.

**Sequence:** Later external integration, after provider feasibility, cost, reconciliation and operational ownership review.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P04 · WhatsApp and Viber notification delivery

**Description:** Additional notification channels are deliberately limited to WhatsApp and Viber for low friction, cost control and one-person operational simplicity. SMS is not considered viable for this candidate. Full omnichannel remains desirable but deferred; no other new channel is proposed here.

**Dependencies and boundaries:** Post-S11 because accepted core notifications, audience selection, preferences and delivery evidence must already work. Use the existing outbox, retry and deduplication model. Respect verified recipient binding, consent, live membership, tenant scope, default deny and delivery audit. Do not broadcast private financial/document data to shared groups or stale recipients. Review actual provider availability, pricing and support requirements before selection; no low-price assumption is a commitment.

**Sequence:** Later integration, after opt-in demand and a sustainable delivery/support model are evidenced. Existing baseline notification obligations remain unchanged.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P05 · Amenity booking extension

**Description:** Extend accepted clubhouse/function-room services with a simple resident calendar, availability, capacity and booking visibility. This does not defer any baseline S09 amenity requirement.

**Dependencies and boundaries:** Post-S11 extension because asset records, amenity policy and pilot scheduling behavior must be proven first. Respect resident membership, community scope, default deny and booking audit. Capacity/conflict checks and accepted approval rules must be enforced in trusted services, with idempotent changes and outbox notices where used.

**Sequence:** Middle group; choose only improvements demonstrated by pilot booking needs.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P06 · Lightweight pet/vehicle registry and gate visibility

**Description:** Improve the accepted pet/vehicle registry with narrowly scoped guard visibility linked to current authorized households. Existing S08–S09 registry and gate requirements remain in their owning sprints.

**Dependencies and boundaries:** Post-S11 extension because property relationships and gate/registry controls must be proven. Respect current resident membership, effective household links, tenant/community scope, staff MFA/session limits, default deny and audit. Guards see only operationally necessary information; the registry must not expose unrelated households or become an independent grant of entry rights. Use the outbox for notifications rather than a second delivery mechanism.

**Sequence:** Middle group alongside guard workflow improvements.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P07 · Board and committee views

**Description:** Focused views of accepted financial summaries and association resolutions for explicitly authorized board/committee members.

**Dependencies and boundaries:** Post-S11 extension because trusted finance records, resolution/documents and actual governance needs must be proven first. Respect explicit role grants, effective-dated membership, tenant boundaries, RLS/default deny and view/action audit. An elected title alone grants no access. Committee views must not confer finance preparation, approval or access to unnecessary household details. Existing baseline reporting is not deferred.

**Sequence:** Middle group after accepted financial and document surfaces.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P08 · Transparent resident financial reports

**Description:** Resident-facing summaries of collections, aging and major expenses, extending accepted reporting without exposing individual neighbors' financial records.

**Dependencies and boundaries:** Post-S11 extension because reconciled core finance, reporting definitions and pilot evidence must exist. Respect resident authorization, tenant scope, RLS/default deny and auditable report provenance. Use approved disclosure/aggregation rules; a community-wide summary must not reveal another household's debt or payment evidence. Accepted ledger and finance approval controls remain authoritative.

**Sequence:** Middle group after accountant export and agreed report/disclosure definitions.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P09 · Emergency broadcasts with acknowledgment

**Description:** Extend one-way emergency/blast announcements with resident acknowledgment and an auditable delivery/response trail. Delivery and acknowledgment are distinct; neither guarantees a resident's safety or actual reading.

**Dependencies and boundaries:** Post-S11 extension because announcement audiences, emergency operating procedures and core delivery must first be proven. Respect sender authority, effective membership, tenant scope, default deny, preferences/approved emergency policy and audit. Use the existing outbox for delivery and idempotent acknowledgments. No multi-user forum or unapproved SMS channel is introduced.

**Sequence:** Middle group after core notices and operating ownership; external channels depend on P04 approval.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P10 · Multi-association property-manager view

**Description:** A consolidated operator workspace that switches among associations for which a property manager has explicit authority.

**Dependencies and boundaries:** Post-S11 extension because single-association administration and context switching must already be proven. Respect separate memberships, current role grants, staff MFA/session limits, tenant-bound references, RLS/default deny and audit. Platform operator registration is not blanket association access. Reauthorize each selected context, clear stale data on switching, and never expose another association through aggregates, search or exports without separately authorized scope.

**Sequence:** Middle group if pilot evidence demonstrates multi-association management demand.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P11 · Clean association exit package

**Description:** Improve the usability and completeness of documented association exit packages: clearly described data and authorized attachments, reconciliation/provenance and readable manifests.

**Dependencies and boundaries:** Post-S11 enhancement because baseline export, attachment access, offboarding, retention/legal holds and recovery must already be accepted. It does not defer TEN 07 or required S10 exit controls. Respect fresh administrator authorization, tenant isolation, private storage/default deny and audit; exclude credentials and unrelated records. Package creation must not itself delete data or terminate access. Large asynchronous work must use accepted outbox/worker controls.

**Sequence:** Early to middle group after reviewing pilot handover/export experience.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P12 · Narrow AI-assisted document search

**Description:** A lower-risk precursor to P01 that answers queries only from authorized uploaded house rules, regulations and pertinent community documents. It does not access statements, visitor records or other operational tools.

**Dependencies and boundaries:** Post-S11 because document authorization, scan status, current versions and pilot evidence must be proven. Respect verified resident identity, effective membership, tenant/property audience, RLS/default deny and audited queries/retrieval/responses. Cite the authorized source/version and refuse unsupported answers. A search index is not a permission boundary. Preserve AI disclosure, consent and approved audit/retention safeguards; avoid introducing a persistent conversational profile.

**Sequence:** Early group after document/version controls, before any full concierge or action capability.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P13 · Dues calculator and assessment transparency

**Description:** Show a resident exactly how an accepted assessment was computed: area, ownership share, special assessments, penalties and applicable policy/version. Intended as a low-maintenance, low-startup-cost extension to reduce disputes, not a new finance engine.

**Dependencies and boundaries:** Post-S11 extension because accepted assessment rules, exact calculations and reconciled pilot statements must exist. Respect the trusted financial calculation/posting model, resident/property authorization, effective-dated ownership, RLS/default deny and auditable inputs/rule provenance. A displayed calculator must not independently change a posted balance or leak another household's statement. Existing statement/correctness obligations remain unchanged.

**Sequence:** Early group after pilot assessment reconciliation and explanation feedback.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P14 · Recurring visitor and household-staff passes

**Description:** Pre-approved recurring passes for helpers, drivers or family, with explicit validity/expiry and easy revocation. Intended as a low-maintenance, low-startup-cost extension of the accepted visitor model.

**Dependencies and boundaries:** Post-S11 extension because visitor issuance, guard checks, household authority and fallback procedures must be proven. Respect resident membership, effective property relationships, scoped guard authorization, live revocation, RLS/default deny and access audit. Recurrence must not grant indefinite access or bypass accepted approval/entry policy. Notifications use the existing outbox.

**Sequence:** Middle group after gate pilot evidence supports recurring patterns.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P15 · Simple guard incident/security log

**Description:** Timestamped, photo-optional entries for suspicious activity, received packages or resident requests, reviewable by appropriately authorized board/staff. Intended as a low-maintenance, low-startup-cost extension of accepted guard surfaces.

**Dependencies and boundaries:** Post-S11 because trusted guard identity, event attribution, documents and review audiences must already be proven. Respect tenant/community scope, staff MFA/session limits, effective roles, RLS/default deny and an append-only audit model. Corrections preserve original events. Optional photos must use accepted private upload/scanning/retention controls; guards or board reviewers must not gain unrestricted resident data access.

**Sequence:** Middle group after pilot identifies useful incident categories and an accountable reviewer.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P16 · Document version acknowledgment

**Description:** Ask residents to acknowledge a specific newly published version of house rules or policies and retain the acknowledgment/version link. Intended as a low-maintenance, low-startup-cost extension of accepted document and announcement surfaces; also improves P12/P01 source clarity.

**Dependencies and boundaries:** Post-S11 extension because document versioning, audiences and publication authority must first be proven. Respect resident identity, effective membership, tenant/property scope, private storage/RLS/default deny and immutable acknowledgment attribution. Do not equate acknowledgment with legal consent or claim it proves comprehension. Retries must not duplicate acknowledgments; notices use the outbox. Existing baseline versioning requirements are not moved.

**Sequence:** Early group, before broader document-search/concierge rollout.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P17 · Accountant financial export

**Description:** Clean CSV/Excel exports of accepted collections, aging and expenses for an authorized accountant. Intended as a low-maintenance, low-startup-cost extension of existing finance/reporting surfaces, not a replacement ledger or statutory filing service.

**Dependencies and boundaries:** Post-S11 extension because reconciled financial records and definitions must first be accepted. Respect explicit finance/export authority, effective membership, tenant isolation, RLS/default deny and export audit. Preserve exact amounts, reporting periods and source provenance; include only authorized records. Treat exported text safely and use accepted private delivery/outbox controls if asynchronous. Baseline required reporting/exports remain in scope where already assigned.

**Sequence:** Early group after pilot reconciliation and accountant format feedback.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## P18 · Operator-side reconciliation engine integration

**Description:** Evaluate bahala.ai or an equivalent deterministic, provenance-grounded reconciliation engine for inbound vendor invoices, utility bills, HOA notices and payment slips. Extract verified obligations, collapse duplicates and import a reviewed, audited schedule into the appropriate Enclavix receivables/ledger workflow. Store provenance pointers. This is an operator-side reconciliation aid, not a resident-facing agent; it complements P01 rather than replacing it.

**Dependencies and boundaries:** Post-S11 because financial classification, reviewed import/approval, duplicate prevention, reconciliation and pilot evidence must already be proven. Respect explicit operator/finance authority, tenant boundaries, effective roles, RLS/default deny and end-to-end audit. An extracted obligation must not automatically become a resident receivable or posted ledger entry: existing classification, approval, exact-value, idempotency and reconciliation controls remain binding. Keep provenance accessible only to its authorized audience. Prefer reviewed file/export or authenticated webhook import over tight coupling; use the existing outbox for asynchronous work. No provider capability or integration contract is assumed proven.

**Sequence:** Later external integration, after a provenance/accuracy evaluation and explicit finance/operating-owner approval. No late-S04 extension is authorized.

**Scope:** Outside S03–S11. Do not start before S11 acceptance, pilot evidence and separate implementation approval.

## License posture and intended commercial boundary

The existing repository license is [MIT](../../LICENSE); this planning document changes no license file or existing grant. Core web work through S11 remains MIT: S00–S02 foundation/identity/authorization/audit, S03 onboarding/membership, S04 receivables/payment verification, S05 resident services/documents, the core data model and web flows of S08–S09 (visitors/gate/basic parking/pets/amenities), S10 hardening and S11 pilot acceptance.

Android work identified by S06–S07 and future iOS are intended as commercial / post-MIT decision items outside the intended MIT core web scope. “Post-MIT” describes a future commercial packaging/licensing decision; it does not mean MIT expires or that existing MIT code is automatically relicensed. This register creates no exception to the current repository license. A separately scoped mobile distribution and its actual license must be decided and recorded before code is introduced under a different license. The mobile timing/release changes remain proposed until the roadmap is explicitly rebaselined.

After pilot acceptance and before broader commercial launch, decide the commercial model for the overall offering and future differentiators: continue MIT, dual-license, source-available or proprietary. No option is selected here. Core web MIT commitments and existing MIT notices/grants must be respected. These post-S11 differentiators are not required for pilot acceptance and may receive a different future license only through an explicit, documented decision for the affected new work. Commercialization and implementation are not approved merely by documenting a candidate.
