# ADR 0006: Synthetic onboarding and registry services

Status: S03 implementation in progress; engineering review and owner sprint acceptance pending. D13's approval flow was explicitly approved by Jerome Gotangco on 2 November 2026. D01/D02/D03/D08 remain as recorded.

## Lifecycle and authority

A pre-registered, enabled platform operator with verified email and fresh MFA creates a sandbox association and nominates a different, existing verified account. The nominated administrator receives one explicit association-wide administrator grant. There is no anonymous bootstrap, user-metadata role inference or client cookie authorization.

The nominee completes address, branding, billing day, notification/support contacts, privacy notice reference, community structures and properties. Submission computes the checklist from current data. Any onboarding registry/configuration mutation invalidates submission. A different operator, distinct from creator and nominee, reviews authority evidence and the checklist and activates the exact submitted revision under the association lock. Activation recomputes requirements. `sandbox` is constrained true in the database; there is no real-data activation route or privacy approval implied by this workflow. Evidence references are attestations, not verified legal documents; document ingestion/review belongs to S05.

Operators inspect lifecycle metadata/checklists, not resident registries. Registry reads require a live global administrator grant; writes also require a session younger than ten minutes. The nominated administrator's revoked or expired membership removes setup access as well. Scoped administrators retain S02 property authorization but cannot edit the whole registry. A civic designation does not grant administrator access.

## Registry and effective dates

Public named RPCs are the only ordinary-client boundary; `app` remains unexposed with all 26 tables denying ordinary DML. Composite foreign keys bind all referenced records to their association/community. Codes are canonicalized and unique within their declared scope. Terminology is bounded configuration, not tenant-specific source. Decimal areas/shares serialize as strings.

Contacts never accept auth IDs, memberships or roles. S02 separately approves account bindings. Administrator relationship actions cannot change their own entitlement, including through represented people. Changes preserve relationship rows, forbid historical backdating, reject overlapping same-person/kind or primary/billing windows, and serialize per association. Transfers close the selected old interval and add a successor. Expired relationships stop granting access; representatives also depend on a current represented owner relationship. Ledger migration and historical financial entitlement verification remain S04 work; no claim of a tested ledger cutover is made.

## Import and reconciliation

CSV is parsed client-side with bounded input and strict quoting/headers. The trusted service accepts only property, person, asset and relationship batches (1–1,000 rows, 1 MiB request ceiling). Import relationships reference existing contact/property keys; import contacts/properties first. No accounts, roles, opening balances or vehicles can be imported in S03.

Staging saves raw logical rows and SHA-256 of canonical PostgreSQL JSON `{kind,rows}`; this fingerprints normalized parsed content, not the original CSV bytes. Preview applies the same command constraints in rollback-only subtransactions and persists row status/issues. No registry, permission or successful command audit persists from preview. Duplicate codes and repeated relationship/contact responsibility claims are flagged. Relationship intervals sharing a person/kind or contact responsibility must be split into separate batches even when non-overlapping, a conservative reconciliation restriction.

Commit locks the association and batch, checks the expected fingerprint, revalidates against the current registry, and applies every row atomically. Stable batch/row keys and batch state prevent duplicates on retry or simultaneous commits. Source changes or intervening conflicts require a fresh preview, never partial application. Explicit confirmation and a reason are required in the web journey. Cancellation preserves provenance. Imports remain staged until deliberately committed or cancelled; unresolved imports block activation.

## Export and offboarding staging

Fresh administrators create an allowlisted JSON snapshot with a SHA-256 fingerprint, size ceiling of 10 MiB, scoped ID and 24-hour access window. It contains registry records and document metadata; it excludes provider user IDs, credentials, sessions, file contents, and financial balances. Downloads reauthorize access and use private/no-store attachment responses. No public URL is issued. Offboarding staging requires an unexpired export that still matches the current snapshot. It does not terminate access, settle workflows, fetch attachments, delete records or implement retention/legal holds. These remain S05/S10 obligations before TEN 07 is complete.

## Clients and verification

`/workspace` exposes the delivered web journeys, and `/api/v1/community/*` is shared by cookie and native bearer clients. Cookie mutations require same-origin JSON; all commands require an idempotency key. Unknown top-level fields/RPC names are rejected. Browser retry keys remain only in memory, scoped to the mounted account workspace; uncertain outcomes retain their keys. Context changes clear displayed records and ignore stale loads. The old mock portals remain isolated.

Tests cover village/condo setup, independent activation, revoked nominees, stale submissions, self-elevation, temporal access, imports, export scope and stale offboarding snapshots. CI adds real provider/native HTTP and two-connection PostgreSQL races. These checks are engineering evidence, not production/privacy certification.

## Migration and rollback

`20261103000000_onboarding_registry.sql` is additive, with new canonical uniqueness indexes and five private tables. Before any non-disposable application, inspect existing codes for case/whitespace collisions; do not rewrite or silently merge records. No production migration is approved. During development revert the unapplied branch; once applied, use a reviewed forward migration, preserve audit/import history and revoke S03 RPC execution for containment. Never drop tables or rewrite an applied migration to recover production state.
