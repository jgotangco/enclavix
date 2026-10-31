# Enclavix Business Requirements

Version 1.0 | 31 October 2026

Canonical repository copy of the BRD. Requirement IDs are stable. Proposed targets and assumptions require approval as recorded in `docs/delivery/DECISIONS.md`.

Production platform for village and condominium communities

Version 1.0  •  31 October 2026
Prepared for Jerome Gotangco and the Enclavix product and delivery team

### Purpose and intended outcome

Refresh Enclavix into a production-grade service that a new homeowners association or condominium management organization can configure and operate without a code fork. Deliver a responsive web front end and an Android application using the same trusted business services, permissions, records, and audit history.

This BRD defines required business outcomes, scope, controls, measurable acceptance criteria, and release gates. It is the baseline for the subsequent product specification, architecture, backlog, and operating procedures. Proposed service targets and commercial assumptions require stakeholder approval before contractual commitment.

### Business case

Community administrators need one reliable record of properties, occupants, assessments, payments, visitors, requests, and shared facilities. Residents need accurate balances and visible request progress. Guards need clear, current entry decisions. Boards need accountable administration and financial oversight across officer transitions.

### Planning baseline

The initial market is assumed to be the Philippines, using PHP and Asia/Manila by default. Each association remains an independent tenant with its own policies, records, administrators, branding, and lifecycle. A management company may administer several associations only through explicit memberships. Condominium governance and property rules must be configurable rather than treated as village rules.

Production readiness applies to every launched module. A phased release may defer an entire module; it must never present an unimplemented workflow as successful. Core resident functions must remain usable through the web for people without Android devices.

### Document map

2 Outcomes and release scope
3 Community onboarding and property model
4 Identity and authorization
5 Billing and financial controls
6 Community operations
7 Web and Android experience
8 Production quality and service operations
9 Architecture and codebase transition
10 Validation and release gates
11 Delivery decisions and references

## 2 Outcomes and release scope

### Success measures

| Measure | Proposed launch target |
| --- | --- |
| Tenant onboarding | An authorized administrator configures a village or condominium without developer changes; sample import of 1,000 units completes within one business day after validated input is available. |
| Operational integrity | All acknowledged financial and access events have durable IDs, actor attribution, and audit records; no silent loss or duplicate posting in acceptance tests. |
| Resident usability | At least 90 percent of representative pilot users complete balance lookup, payment proof submission, and ticket creation without assistance. |
| Pilot acceptance | One village and one condominium complete a full billing cycle; opening balances, collections, allocations, and closing balances reconcile with zero unexplained difference. |
| Security | No unresolved critical or high security findings; all tenant and role isolation tests pass before real data is introduced. |

### Required production pilot scope

Release A includes tenant onboarding, identity, membership and unit registry, configurable assessments, statements and payment verification, announcements, service tickets, documents, notifications, audit, reporting, and administrator web workflows. The Android app includes resident account management, community selection, balances, proof submission, tickets, announcements, and notification preferences. Responsive web provides the same essential resident journeys.

Release B adds visitor and guard operations, vehicles and parking, pets, amenities, and condominium move scheduling. These modules must meet the security and operational gates before activation. Any pilot using Enclavix for gate access requires Release B acceptance and an approved manual fallback before use.

### Deferred scope

Direct barrier or RFID hardware control, automated bank feeds, payment gateway settlement, full general ledger and payroll, statutory tax filing, legally binding electronic elections, biometric identification, iOS applications, and commercial subscription billing are deferred. Manual payment verification is included; automated collection integrations require separate reconciliation and provider acceptance.

### Scope rules

SCP 01  A tenant may enable only modules accepted for production. Disabled capabilities must not appear as operational actions in either client.

SCP 02  Community policies, branding, assessment rules, property structure, and terminology must be configuration data. No tenant-specific source branches or application builds are permitted for standard onboarding.

SCP 03  Platform fees and association dues must be distinct products and ledgers. Suspending a platform subscription must follow a documented notice, read-only access, and export policy rather than silently disabling resident records.

## 3 Community onboarding and property model

TEN 01  Create an association through an approved onboarding workflow with legal or operating name, community type, addresses, timezone, currency, authorized contact, billing cycle, branding, and accountable administrator. Verify onboarding authority before activating real resident access.

TEN 02  Represent platform tenant, community, phase or tower, block or floor, lot or unit, and separately allocatable assets. Support village lots, townhouse units, vacant lots, condominium units, parking slots, storage, and common facilities. Human-readable labels may vary by tenant; immutable internal IDs may not.

TEN 03  Model people separately from properties. A person may own several units, rent one unit, represent a corporate owner, or work for multiple associations. Support several owners and occupants, effective dates, billing responsibility, primary contacts, and supporting approval evidence.

TEN 04  Ownership transfer, tenancy expiration, sale, move-in, and move-out must preserve historical billing and audit records. Access to current household records must end according to effective dates and approval policy. Historic documents must remain restricted to entitled parties.

TEN 05  Import properties, memberships, opening balances, vehicles, and master data through templates with preview, field validation, duplicate detection, row-level errors, reconciliation totals, and approval. Re-running an import must not duplicate records. Retain batch provenance and reversible pre-posting staging.

TEN 06  Onboarding must move through setup, validation, authorized approval, and activation. Require completed unit structure, initial permissions, opening balance sign-off, notification settings, privacy notices, and support contacts. Allow safe sandbox practice with synthetic data.

TEN 07  Offboarding must support authorized export of tenant data and attachments in documented formats, settlement of pending workflows, access termination, and retention or deletion according to the approved schedule and legal holds. Test that one tenant cannot export another tenant’s records.

### Community rule differences

| Village configuration | Condominium configuration |
| --- | --- |
| Block and lot hierarchy; lot area; vacant lot and carport rules | Tower, floor, unit hierarchy; floor area; ownership share where applicable |
| Village and sub-enclave gate permissions | Lobby, tower, parking and service entrance permissions |
| Garage, curb and vehicle allocations by property | Owned, leased and visitor parking allocations with validity dates |
| Lot area or fixed assessments; parent village charges | Unit area, share-based or fixed assessments; parking and special charges |
| Community facilities and contractor entry | Shared facilities, move permits, service elevator slots and contractor windows |

Acceptance example: the same resident signs in once, sees only approved memberships, selects a village lot or condominium unit, and receives the correct property-specific balance and permissions without data from the other association appearing.

## 4 Identity and authorization

IAM 01  Authenticate through a production identity provider with verified contact ownership, invitation or application approval, password recovery, rate limiting, session expiry, and revocation. Registration must not grant property access until an authorized association approver verifies the relationship.

IAM 02  Ignore client-provided role, tenant, property and approval claims. The demo_user_role cookie must never authenticate a production request or grant a permission. Reject access even when forged cookies, modified Android requests, or guessed identifiers name an administrator or another association.

IAM 03  Authorize every server operation and database or storage access using trusted identity, active tenant membership, scoped permissions, and record relationships. Deny by default. Client-side menu visibility is a usability feature and never the enforcement boundary.

IAM 04  Require MFA for platform operators, association administrators and finance approvers. Support shorter shared-device guard sessions, device/session inventory, remote sign-out, reauthentication for sensitive actions, and immediate revocation after removal or role change.

IAM 05  Separate civic positions from permissions. A president, board member or property manager receives no administrative power automatically. Permission changes require an authorized actor, reason, audit event, and effective dates; users cannot approve their own elevation.

IAM 06  Support authorized, time-limited support access with a recorded reason and visible audit trail. Platform operators have no routine access to tenant documents or finances. Emergency access requires a controlled, reviewed process.

| Role | Default responsibility and boundary |
| --- | --- |
| Platform operator | Tenant lifecycle and service health; restricted support access by approved exception |
| Association administrator | Membership, properties and configuration; finance approval only if explicitly assigned |
| Finance preparer and approver | Prepare charges or reconcile proofs; approval permission separated according to tenant policy |
| Board reviewer or auditor | Read-only reports and authorized evidence; no posting or deletion |
| Guard or facilities staff | Minimum directory and operational functions for assigned site and shift |
| Owner or authorized representative | Approved units, statements and household workflows within relationship permissions |
| Tenant or occupant | Approved residence services; owner-only records and financial details withheld unless explicitly entitled |

IAM 07  A user may hold different roles in different associations. Every screen and sensitive confirmation must identify the active community and property. Switching context must clear stale data and may never reuse another tenant’s authorization.

## 5 Billing and financial controls

FIN 01  Maintain effective-dated assessment schedules for fixed, area-based, share-based and recurring asset charges, special assessments, discounts, penalties and parent-community pass-throughs. Require approved rule changes and preserve the formula and inputs applied to each posted charge.

FIN 02  Generate statements transactionally and idempotently per tenant, property and period. Support partial-batch recovery and previews. Use exact decimal amounts and an approved rounding policy. Reconcile batch totals before posting; never silently recalculate prior posted statements.

FIN 03  Maintain a durable receivables subledger with charges, payments, allocations, credits, adjustments, refunds and reversals. Support partial payments, overpayments, multiple payments, prior balances, disputes and transfers under explicit policy. Every closing balance must be reproducible from posted entries.

FIN 04  Residents submit payment method, date, amount, reference and proof through private upload. Submission creates a pending record, not a paid invoice. Finance checks evidence and duplicates, approves or rejects with a reason, and allocates an approved payment to eligible charges.

FIN 05  Record the preparer, approver, timestamps and evidence. Enforce configurable approval limits and separation of duties; any small-association exception must be explicitly approved and audited. No user may erase posted financial history or silently alter their own approval record.

FIN 06  Issue unique tenant-scoped receipt identifiers through a controlled sequence; preserve issued and voided numbers. Correct errors through linked reversals and replacement documents. Generated acknowledgments must use terminology approved for the association’s accounting and receipt obligations.

FIN 07  Allocate a violation fine to a charge once using a durable relationship. Repeated invoice generation may not recharge it. Penalties must follow approved grace periods, caps and calculation bases, with auditable waivers and disputed-amount handling.

FIN 08  Provide aging, collection summaries, charge and payment registers, unit statements, adjustments, exports, and daily reconciliation. Period closure must prevent unauthorized backdating; reopening requires approval and a retained reason. Opening balances need signed reconciliation and import provenance.

### Acceptance scenarios

A repeated monthly batch creates no duplicates and resumes missing units. A payment of PHP 2,000 against a PHP 3,000 balance leaves PHP 1,000 outstanding. An overpayment becomes a visible credit. Replayed approval requests post once. A reversed payment restores the correct balance without deleting the original receipt. A fine appears in exactly one charge unless formally reversed and reassessed.

### Collection integrations

If enabled later, gateway notifications must be authenticated, deduplicated and reconciled against settlement data. A mobile success screen is never proof of settlement. Enclavix must not store payment card credentials. Provider fees, refunds and failed settlements require explicit accounting treatment.

## 6 Community operations

OPS 01  Tickets require category, property or common-area location, description, optional private attachments, accountable team, status history, response target and resident-visible progress. Support assignment, escalation, reopening and closure evidence. Limit sensitive complaints to authorized staff.

OPS 02  Announcements require audience targeting, publish and expiry dates, optional urgency, attachments and revision history. Residents must see only applicable communities and audiences. Record delivery and acknowledgment where required; notification failure must not hide the source announcement.

OPS 03  Documents require tenant and audience permissions, version history, private download access, retention rules and export. Apply file type and size controls, malware scanning, and access logging. Never expose permanent public URLs for receipts, registrations or resident evidence.

OPS 04  Amenity reservations must enforce capacity, operating hours, deposits, eligibility, cancellation and blackout rules. Check conflicts atomically across simultaneous requests. Confirmed reservations may not overlap exclusive resources. Refund and deposit outcomes must link to financial records.

OPS 05  Visitor credentials require an authorized host, destination, gate scope, validity window, status and revocation. Use unpredictable identifiers with collision prevention and rate-limited verification. Guard check-in must validate current entitlement server-side and record actor, gate, timestamp and outcome.

OPS 06  Vehicle and parking records require property association, entitlement dates, assignment history and restricted evidence. Enforce capacity and allocation constraints across concurrent changes. A suspended or expired credential must not produce a clear-to-enter result. Actual barrier hardware remains a separate integration.

OPS 07  Pet records require responsible household, species, applicable documents and expiry dates. Determine compliance using current community-local dates and configurable policy. Notify before expiry and support corrected evidence; avoid fixed demonstration dates.

OPS 08  Violations require evidence, location, policy reference, accountable reporter, review, resident response or appeal, and resolution history. Financial assessment requires an authorized decision; a guard report alone must not automatically create an irreversible fine.

OPS 09  Condominium moves and contractor visits must support approved windows, service entrance or elevator capacity, responsible unit, deposits and facility checks. Retain approvals and condition reports without granting contractors general resident access.

OPS 10  Guard service must define network-failure behavior. Default to manual escalation or denial of automated clearance, with supervisor procedure and later reconciliation. Offline mode must not imply knowledge of recent revocations or issue an unconditional clearance.

Acceptance example: a resident-created visitor pass appears at the correct guard station, is rejected before or after its window, can be revoked by the host, and cannot be replayed where single-use entry is configured. Every accepted entry produces one durable gate event.

## 7 Web and Android experience

### Channel responsibilities

| Capability | Responsive web | Android |
| --- | --- | --- |
| Resident essentials | Full essential access | Full essential access |
| Association administration and bulk imports | Primary workspace | Deferred unless explicitly scoped |
| Finance preparation and approval | Primary workspace | Balances and proof submission; approval deferred |
| Guard operations | Dedicated kiosk in Release B | Managed staff mode in Release B |
| Reports and configuration | Primary workspace | Resident documents and history |
| Notifications and uploads | In-app and email; browser capabilities where supported | In-app, email, push and camera or file upload |

UX 01  Use one account across channels with identical permissions and business state. Make active association and unit prominent. Show empty, pending, rejected, offline and failed states distinctly; never report success before the server accepts the operation.

UX 02  Support accessible responsive layouts and WCAG 2.2 AA acceptance for web; equivalent Android screen-reader, contrast, focus, text-scaling and touch-target checks. Test key journeys with TalkBack and keyboard navigation. English launches first; Filipino localization must be structurally supported.

AND 01  Deliver a maintained Android app with secure session storage using platform-backed protection, system-browser authentication where applicable, verified deep links, explicit permission requests, and logout that clears private cached data. No service credentials or privileged database keys may ship in the app.

AND 02  Push notifications are optional delivery aids. Their text must avoid sensitive financial, visitor or complaint details on lock screens. Deep links require authentication and fresh record authorization. Denial of notification permission must not block resident services.

AND 03  Support interrupted uploads with visible retry and duplicate prevention. Compress images within evidence-quality limits. Preserve drafts safely, label unsent items, and revalidate permissions on sync. Financial approvals and gate decisions require online confirmation in the initial release.

AND 04  Publish a signed production build through the approved Play distribution channel, with release-key custody, privacy disclosures, account deletion flow, crash monitoring, staged rollout and rollback or server feature disablement. Device support is proposed as Android 10 and later, subject to pilot device validation and current store requirements.

UX 03  Display amounts, dates and deadlines consistently in the community timezone. Warn before destructive or irreversible actions; provide confirmation references and human support routes. Shared guard devices require quick secure session switching and restricted background previews.

Initial offline scope: cached low-sensitivity announcements and explicitly permitted resident records, plus queued drafts. Encrypt sensitive local storage, apply cache expiration and remote revocation policy, and require online authorization before sending queued changes. Do not cache complete resident directories by default.

## 8 Production quality and service operations

The following are proposed internal launch targets. Validate them against pilot scale, hosting costs and support capacity before publishing a customer SLA.

| Requirement | Acceptance target |
| --- | --- |
| NFR 01 Availability | 99.9 percent monthly availability for core authenticated services, measured externally; maintenance and exclusions must be documented before contracting. |
| NFR 02 Performance | At the approved load profile, p95 core API reads within 1 second and writes within 2 seconds excluding uploads and external providers; primary resident screens usable within 3 seconds on the agreed midrange Android and 4G test profile. |
| NFR 03 Capacity | Validate at least 100 associations, 50,000 units and 1,000 concurrent active sessions, with uneven tenant load; no authorization leakage or unexplained financial divergence. |
| NFR 04 Recovery | Core database RPO at most 15 minutes and RTO at most 4 hours; document separate attachment recovery targets and test complete restore before pilot, then quarterly. |
| NFR 05 Security | Threat model, independent penetration test, secrets scanning, dependency scanning, MFA, rate limits, secure sessions and private file access; zero open critical or high findings at launch. |
| NFR 06 Observability | Correlate requests, jobs and audit events; redact sensitive values. Alert on elevated errors, job lag, access anomalies and failed reconciliation. Define accountable responders and escalation. |
| NFR 07 Accessibility | Pass automated checks and manual assistive-technology testing for all critical journeys; no unresolved defects that prevent task completion. |

REL 01  Use separate development, test, staging and production environments and identities. Demo environments use synthetic data and cannot reach production services. Missing required configuration must fail deployment rather than silently use dummy credentials.

REL 02  Keep audit events append-only from normal application roles, including actor, tenant, action, record, time, result and approved reason. Protect financial and permission history from routine edits; define retention and supervised archival.

PRV 01  Maintain a data inventory, purpose and access register, retention schedule, incident process and tenant-specific privacy notices. Support access, correction, export and deletion requests with identity checks, legal holds and financial-record retention exceptions. Determine controller and processor responsibilities before onboarding.

REL 03  Provide runbooks for outages, suspicious access, lost guard devices, payment discrepancies, delayed notifications, restore, tenant offboarding and officer handover. Name a launch support owner and emergency responder; test escalation during pilot.

## 9 Architecture and codebase transition

### Required system boundaries

Web and Android must consume the same versioned business services. Trusted services enforce tenant context, permissions, financial rules and transaction boundaries; databases and private object storage enforce independent access controls. Background workers handle scheduled billing, delivery, scanning and exports with retries, idempotency and operational visibility.

Retain Next.js as a candidate web framework and Supabase PostgreSQL, Auth and Storage as candidate managed services, subject to architecture and cost review. Android may use Kotlin with Jetpack Compose or React Native; choose through a short device, authentication, push, upload and maintenance prototype. The choice must not duplicate business rules or weaken authorization.

ARC 01  Every tenant-owned record must have enforceable tenant ownership. Cross-table references must not permit a property, payment, attachment or membership to reference another tenant. Validate isolation in services, database policies, storage paths, background jobs, exports and caches.

ARC 02  Use explicit financial posting operations, database transactions and unique business keys. Support safe retries, concurrency conflicts and asynchronous outbox delivery. Do not rely on a UI button being clicked once or a mobile request arriving once.

ARC 03  Version APIs and database migrations. Support older Android clients for a documented compatibility window; use capability detection and minimum-version enforcement for critical security changes. Deploy additive migrations first and provide tested rollback or forward-repair plans.

### Refresh approach

| Existing area | Required treatment |
| --- | --- |
| UI and domain terminology | Reuse after accessibility, workflow and authorization review; preserve useful village concepts while adding condominium structure. |
| Demo login and persona cookies | Replace production authentication completely; move synthetic personas into an isolated demo service. |
| Mock data and page-local state | Replace with shared persistent services and server-confirmed results; retain fixtures only for tests and isolated demos. |
| Schema and handwritten types | Repair SQL; add tenant and membership model, policies and transactional records; regenerate types from validated migrations. |
| Container and deployment files | Repair clean build, locked dependencies, configuration validation, private secrets, health checks and release gates. |
| Financial and access workflows | Reimplement trusted posting and validation operations; do not promote simulated success handlers into production unchanged. |

The reviewed repository is the conceptual baseline, not a deployable production foundation. Before migrating any real installation, inventory its actual schema, data, grants and integrations. Map and reconcile records in staging; obtain tenant approval and a tested rollback plan before cutover. Source review alone does not establish the state of any deployed project.

## 10 Validation and release gates

| Gate | Required evidence and acceptance owner |
| --- | --- |
| G1 Foundation | Engineering lead: clean checkout builds web and Android; reproducible dependencies; fresh migrations and seed; isolated environments; monitored deployment and rollback. |
| G2 Identity and isolation | Security lead: forged demo cookies denied; tenant and role matrix passed across API, database, storage, jobs and exports; revoked memberships lose access on both clients. |
| G3 Financial integrity | Finance owner: opening balances signed off; duplicate, partial, concurrent and reversed transactions reconciled; receipt uniqueness and period controls validated. |
| G4 Cross-channel operations | Product owner: resident submits on Android, staff processes on web, resident sees durable outcome; retry, offline, deep-link and context-switch scenarios pass. |
| G5 Operational readiness | Operations and privacy owners: restore drill, alerts, support rota, retention policy, incident exercise, tenant export and Android staged-release procedures accepted. |
| G6 Controlled pilot | Village and condominium sponsors: complete full billing cycle and user acceptance, reconcile all funds, resolve task-blocking defects and approve rollout. |
| G7 Gate modules if enabled | Security operations owner: expired, revoked, replayed and wrong-gate credentials rejected; concurrent entries and network outage procedure tested before real gate use. |

### Mandatory test coverage

Unit tests cover assessment calculation, rounding, penalty policy and state transitions. Database integration tests cover tenant policies, ownership constraints and transactions. End-to-end tests cover invitations, approval, multi-property context, collection verification and officer handover on web and Android. Contract tests preserve supported app compatibility. Load tests and restore exercises use representative tenant skew and document volumes.

Security regression cases include no session plus forged administrator cookie; resident requesting another tenant’s invoice or attachment; removed staff reusing a session; client-modified payment amount; repeated approval request; expired private URL; notification deep link after membership termination; and background export with mismatched tenant context.

### Definition of done

Each requirement must map to an owner, implementation work item, positive and negative acceptance scenarios, and evidence in the release record. A feature is done only when data persists, permission checks pass, failures are visible, audit history exists, accessibility is verified, support documentation is available, and monitoring is active. Critical and high security findings block launch; lower-risk exceptions require a named owner, rationale and remediation date.

Pilot rollout begins with approved staff and synthetic rehearsal, then a limited resident cohort, then the full association. Retain legacy financial records and manual gate procedures until reconciliation and cutover acceptance. Expand to additional tenants only after the first village and condominium have met G6.

## 11 Delivery decisions and references

### Delivery sequence

Phase 0 establishes policy decisions, discovery with a village and condominium, a validated domain model and architecture. Phase 1 repairs the foundation and delivers tenant onboarding, identity and isolation. Phase 2 completes Release A web and resident Android workflows. Phase 3 runs the controlled pilot and recovery exercise. Phase 4 activates Release B operations after module acceptance. Estimate dates and budget only after discovery, technical spikes and staffing are agreed.

### Decisions required before implementation commitment

| Decision | Proposed default and accountable approver |
| --- | --- |
| Market and legal entity scope | Philippines first; support HOA and condominium management organizations with distinct terminology and policies. Product sponsor confirms. |
| Commercial and hosting model | Shared multi-tenant service with strict isolation; dedicated hosting is a separately priced exception. Sponsor and architecture lead confirm. |
| Finance policies | Manual proof verification first; exact rounding, payment allocation, approvals, receipt terminology and retention approved by each association’s finance owner. |
| Android delivery | Resident app first; guard mode in Release B; Android 10 baseline subject to device survey. Product and engineering leads confirm stack and support window. |
| Privacy and recovery | Approve residency, subprocessors, retention periods, support access, RPO/RTO and restoration costs before real onboarding. Privacy and operations owners confirm. |
| Pilot scope and owners | Secure one village and one condominium sponsor, finance approvers, guard leads if applicable, support capacity and acceptance signatories. Sponsor confirms. |

### Source baseline and traceability

Repository: https://github.com/jgotangco/enclavix
Reviewed default-branch commit: d150f8b3a84b77a53c9f1136434481ed544d4067
Review baseline: 31 October 2026. The preceding read-only review identified source-level authentication bypass, absent RLS policies, malformed source and SQL, simulated persistence, hardcoded property identity, and deployment gaps.

Primary repository references: README.md; docs/ENCLAVIX_SDD.md; src/lib/supabase/middleware.ts; src/app/login/page.tsx; src/components/role-switcher.tsx; supabase/migrations/20260822000000_initial_schema.sql; src/app/admin/billing/page.tsx; src/app/resident/billing/page.tsx; src/app/guard/page.tsx; Dockerfile; cloudbuild.yaml; package.json.

Remediation trace: authentication and RLS findings map to IAM 01–07 and ARC 01; simulated and hardcoded workflows map to TEN 03–05 and FIN/OPS requirements; financial gaps map to FIN 01–08; deployment and testing gaps map to REL 01–03 and gates G1–G7. Legal, tax, privacy and app-store requirements require current specialist validation before release; this BRD does not assert regulatory certification.

### Approval record

Product sponsor, association pilot sponsors, finance owner, security lead, privacy owner, engineering lead and operations owner approve their relevant requirements and exceptions in the delivery system. Approval establishes the implementation baseline; changes require impact assessment on scope, cost, security, migration and acceptance evidence.
