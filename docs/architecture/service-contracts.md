# Shared service and transaction contract

S01 specifies the shared contract. S02 implements the account/access subset described in ADR 0005; business workflow endpoints remain later-sprint scope. Web and Android must call the same services. Client tenant/property IDs are requested context, not trusted authorization. No generated database type or hidden UI button is a permission check.

## Request boundary
1. Verify identity and session assurance using the production provider; reject expired/revoked or insufficient-MFA sessions.
2. Resolve active membership and scoped role grants from protected records using the verified principal, active tenant, community and effective time. A civic designation is not a system role. Explicitly validate property relationships for resident records.
3. Validate an allowlisted command payload. Ignore/reject client ownership, actor, approved status, amount, scan status and audit metadata unless the particular operation explicitly permits that input. Normalize user-facing codes and dates.
4. Open a transaction with a restricted database role, trusted transaction-local context and tested row/storage policies. Never leak context through a reused pooled connection. S02 uses per-request provider clients and PostgREST transaction-local verified JWT context; read functions use a non-login RLS-constrained role, while named mutations have explicit privileged checks. See ADR 0005.
5. Execute a named business command with tenant-scoped lookups and compare-and-set/locking as needed. Commit business changes, operation result, audit and outbox in one transaction. Send external notifications only after commit through durable delivery.
6. Serialize a stable response. Do not cast a pg row to the generated transport type without date/decimal conversion. Private IDs are opaque; errors must not disclose another HOA’s records.

## Future API families
| Boundary | Owning sprint | Contract |
| --- | --- | --- |
| /api/v1/session and memberships | S02 | Verified identity, MFA assurance, authorized context list and revocation |
| /api/v1/tenants/{tenant}/properties and people | S03 | Scoped reads; explicit onboarding, invitation, transfer and closure commands |
| /api/v1/tenants/{tenant}/imports | S03 | Stage, validate, reconcile, approve, commit; no arbitrary table writes |
| /api/v1/tenants/{tenant}/billing | S04 | Exact decimal posting, payment verification, allocations and reversals |
| /api/v1/tenants/{tenant}/documents and tickets | S05 | Private evidence, scanning, authorized downloads and state transitions |
| /api/v1/tenants/{tenant}/gate | S08 | Current entitlement and validity verification, scoped audit and idempotent entry |

## Idempotency and failure semantics
Use a unique operation/tenant/idempotency-key tuple with a canonical request SHA-256. Same key and same hash returns the stored result; same key and a different hash returns a conflict. A pending duplicate must not execute again. Unique database constraints are present in S01; the handler, locks and stored-response replay arrive with the owning business command. Tests prove transaction rollback and one winning insert under real two-connection contention, not complete payment idempotency.

Each operation owns an ordered set of outbox records. Events include a schema version in their type, immutable identity and tenant context. A duplicate event delivery must be safe at the receiver using its event ID; a successful database commit is not a guarantee of external delivery. No network call may create a half-posted payment.

Recommended response envelope: data plus request ID on success; stable error code and request ID on failure. Use unauthenticated/forbidden/not-found/conflict/validation/rate-limited/unavailable semantics consistently. Avoid revealing existence across tenants. For financial values use amount and currency strings; clients format locally but never recompute authoritative balances. GET requests cannot mutate state. Cache keys must include principal/tenant/context and must be cleared on sign-out or membership changes.

Before S02 is accepted, verify service, direct database, pooled-context reuse, storage, worker, export and cache negative cases. S01 proves the schema foundation and keeps every ordinary operation denied; it is not an authorization implementation.

## S02 implemented subset

GET `/api/v1/session` returns verified identity, authorized association/community/role contexts, factors and current-identity session inventory. GET tenant `properties`, `applications`, `access-directory` and `access-audit` routes enforce their respective read scopes; the latter three require association-wide administrator authority. A document request additionally checks clean scan state and owner/occupant/admin audience before returning a no-store attachment, never a signed URL.

POST `auth/login`, `auth/register`, `auth/recover`, `auth/password`, `auth/mfa/enroll` and `auth/mfa/verify` are web-cookie flows. Native clients own provider session/PKCE/MFA/refresh storage and send bearer tokens for shared service requests. `auth/logout` supports cookie and bearer sessions; `auth/revoke-session` targets only the current identity's sessions. Mutation payloads are allowlisted; cookie mutations require same-origin JSON.

Access commands are `access/apply`, `access/review`, `access/invite`, `access/accept`, `access/revoke-invitation`, `access/role`, `access/revoke` and `access/support`. Supply an `Idempotency-Key` header for API commands. Role changes, membership removal, invitation creation/revocation and support decisions persist a canonical payload hash and operation/audit result atomically. Retrying the same actor/key/payload has no second effect; conflicting content returns 409. Invitation plaintext is returned once and not retained for replay: a lost response requires revoking the recorded invitation and issuing a new command/key. Applications have pending uniqueness and locked one-time review; tokens have locked one-time acceptance. No email or notification delivery is falsely acknowledged by these commands.

No worker/export endpoint or client table-writing grant is present. Their future handlers must inherit these boundaries and gain their own positive/negative acceptance tests.

Local S02 review repairs preserve active members’ existing permissions on property approval. UI retries retain the original command key for uncertain outcomes, and invitation creation additionally rejects an existing live invitation for the contact. Web signup/recovery surfaces provider throttling/outages and correlates overlapping PKCE callbacks with validated `sb_flow_id` values; hosted redirect allowlists must preserve that identifier. Refreshed CI for these uncommitted repairs remains pending.
