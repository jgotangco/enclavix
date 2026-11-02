# ADR 0005 S02 identity and authorization contract

Date: 2 November 2026. S02 engineering implementation accepted; production infrastructure remains unapproved. D07 policy approved by Jerome Gotangco: MFA for every staff/administrator role, no shared staff accounts, immediate membership revocation, and explicit time-limited support approval.

## Trust boundaries

Supabase Auth verifies email ownership, passwords, recovery and TOTP. A new account has no association or property rights. Web requests use per-request server clients and HttpOnly, Secure (optimized builds), SameSite=Lax PKCE cookies. Native clients authenticate with the provider and send bearer tokens to the same `/api/v1` services. Browser code receives no refresh/access token or backend key from these routes. Cookie mutations require same-origin JSON; allowlisted request fields and bounded body reads reject invented actor, role and approval fields. Authorization headers never fall back to a cookie identity.

Each provider/Data API request is independent; no mutable global client or database pool context is reused. `getUser` checks the provider; PostgREST verifies JWTs before installing transaction-local `request.jwt.claims`. Internal helpers then check the signed subject/session against live `auth.users` and `auth.sessions`, email confirmation, bans, token/session expiry, active association/membership, effective dates and current grants. Clients receive no SQL login, role membership or claims setter. Never expose a raw SQL/session-context endpoint.

## Database roles and services

`app` remains outside exposed schemas. Neither anonymous nor authenticated clients receive app table privileges. Public `enclavix_*` RPCs are explicitly allowlisted and executable only by `authenticated`; prototype public tables remain denied. Read RPCs are owned by `enclavix_reader`, a NOLOGIN, NOINHERIT, NOBYPASSRLS role with narrow SELECT policies. It owns no tables and is not granted to API/client roles. Protected helper functions inspect Auth/membership records with fixed `pg_catalog` search paths and explicit qualified references.

Named mutation functions use SECURITY DEFINER with explicit checks, scoped references, tenant advisory locks, row locks and atomic audit writes. There is no general table-write command. A recent, MFA-assured association-wide administrator must approve another person's application/elevation. Civic titles never authorize a command. Application requests are untrusted text; approval binds an existing verified contact and property. Invitations contain two random UUIDs, are stored only as SHA-256 hashes, expire in 48 hours and are bound to the recipient's verified email. Acceptance also checks the inviter's current authority. Revocation and reapproval do not resurrect previous staff grants.

SECURITY DEFINER routines are privileged code and require security review. A database owner can alter policies/triggers; this is not owner-tamper protection. First administrator and platform-operator bootstrap requires a separately reviewed operations procedure and verified onboarding authority; there is no public bootstrap or impersonation endpoint.

## Session and support policy

Maximum absolute authorization lifetimes: residents eight hours, all staff one hour, any active guard role thirty minutes. All staff roles, including board reviewers and facilities staff, require AAL2. Sensitive access changes require a provider session created in the past ten minutes plus MFA; refreshing a token does not reset session age. Password changes require a recent session and enrolled MFA, then global sign-out. Lost authenticator recovery has no self-service staff bypass; use a controlled identity review procedure before any provider-side reset.

Every command/read checks current database state. A committed session/membership/role revocation denies the next authorization check; there is no permission cache or JWT-expiry grace period. Already-authorized in-flight work/bytes cannot be recalled. Device/session inventory is restricted to the current identity, with selected-session revocation and provider local/global/other-session sign-out. Provider session deletion/refresh behavior is verified against disposable local Supabase.

Operators have no routine tenant access. Only pre-registered enabled operators can receive explicit approval from a different association-wide administrator, with reason, maximum sixty-minute lifetime, current approver authority and audit history. Support is limited to association/community metadata; no properties, documents, financial data or mutations. Emergency impersonation is disabled; a future emergency process needs separate approval and review.

## Private storage and disabled services

The `tenant-private` bucket is private with no client object policies. Even entitled residents cannot create signed URLs, preventing links that survive revocation. A download request resolves clean document metadata under RLS and household/admin scope, then uses a server-only storage key to return an attachment with no-store headers. The key is used only for that already-authorized storage read, never for ordinary business commands. Without the key the download fails closed. Limits are 20 MiB for this foundation; uploads, malware scanning, content policy and version/retention workflows belong to S05. Do not treat synthetic clean metadata as a real scanning service.

No operational mock portal, worker, export or finance endpoint becomes accessible through real identity. `/account` is the production account/context workspace; `/admin`, `/guard` and `/resident` stay mock-only. Exports and workers have no grants or executable service endpoints. Context changes and sign-out clear tenant-specific client state. Responses are private/no-store and no signed file URL is returned.

## Deployment prerequisites

D03 region/hosting and real onboarding remain unapproved. Before any hosted enablement, review provider email templates/redirect allowlists, SMTP delivery, email confirmation, TOTP settings, sign-in/recovery rate limits, HTTPS origin/proxy configuration, cookie behavior, secret custody and first-admin bootstrap. Existing provider rate limits apply; shared backend egress requires edge abuse controls before production. No hosted project is configured by this sprint.

`ENCLAVIX_LOCAL_AUTH_TEST=1` permits only the exact disposable HTTP endpoint `127.0.0.1:54321` for integration tests; it does not bypass identity or grant permissions. Never use that opt-in for deployment. Database/schema permission changes are additive; rollback is a forward repair that revokes S02 RPC execution and closes the account endpoints, not removal of historical audit or identity data.

Sources checked 2 November 2026: [Supabase sessions](https://supabase.com/docs/guides/auth/sessions), [SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [sign-out](https://supabase.com/docs/guides/auth/signout), [Next.js authentication](https://nextjs.org/docs/app/guides/authentication). Permission commands use durable operation keys and canonical payload hashes; safe retries do not repeat side effects, and conflicting keys are rejected. Lost invitation plaintext is not replayed. No dependencies were added or upgraded.

## Accepted S02 review repairs (2 November 2026)

An additive repair migration preserves active members’ independent roles, scope and membership expiry during property approval; only inactive reinstatement clears stale grants. New resident scope is limited to the approved community and existing current relationships/grants are not duplicated. A second live invitation for a contact is rejected under the tenant lock until the first is revoked, protecting reloads and lost client retry state.

The account client retains keys for uncertain access-command outcomes (network loss, invalid responses and server failure). Matching retries reuse the key; explicit invitation revocation clears only its matching pending creation; account changes clear private in-memory state. No payload or credential is persisted to browser storage.

The pinned SDK’s `experimental.appendPkceFlowIdToRedirects` is explicitly enabled for server web flows and the callback validates/passes `sb_flow_id`. New email redirects require the query-bearing callback to remain within the provider’s approved origin/allowlist; verify hosted configuration before deployment. SDK callback/cookie behavior is exercised against a synthetic loopback provider, not represented as actual email delivery. Provider error responses are checked: throttling produces 429, outages/configuration failures produce 503, and known account-existence signals retain the same generic response.
