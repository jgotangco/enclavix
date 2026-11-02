# Account and access operations — S02 development baseline

This is an engineering runbook, not authorization for production deployment. S02 engineering scope and review repairs are accepted; production use remains unapproved. Use only synthetic data until hosting, privacy, onboarding and launch gates are approved.

## Accounts and association approval

Users register with their own email, verify ownership through the provider and sign in. Registration grants no property or tenant rights. An existing association administrator reviews the requested relationship against independently verified contact/property records, then approves or rejects with a reason. The submitted address is a request, never proof. Contact and property setup is S03 work.

An administrator can invite an existing unbound contact to a verified email address. Deliver the token privately through an approved channel; the application does not send invitation messages yet. Tokens expire after 48 hours, can be revoked and are accepted once by the matching verified account. Audit records identify the invitation, actor and reason. Uncertain in-page retries retain their original key; the database also refuses a second live invitation for the same contact, even with a new key after reload. Lost invitation responses cannot recover plaintext from the database: revoke the invitation through the review workspace and create a new one.

Property approval preserves active memberships’ existing roles and expiry. Reinstatement does not restore stale staff grants. Role changes require a different association-wide administrator, a reason, community scope/expiry as appropriate, a sign-in within ten minutes and MFA. Civic titles do not confer system roles. Every staff role requires MFA, including guards and board reviewers. Never provision a shared staff account. A member's removal revokes existing role grants; approval does not restore earlier staff permissions.

## Session loss, recovery and handover

The account page lists the current identity's sessions. Revoke a selected session or sign out all devices after a lost device or suspected access. Membership and role removal take effect at the next server/database authorization check; already completed work and in-flight bytes cannot be recalled. Resident authorization expires after eight hours, staff after one hour, and guard access after thirty minutes from provider session creation. Refresh does not extend these limits: sign in again and verify MFA.

Password recovery uses the provider email flow in the same browser that requested it. Each newly initiated email flow carries a matching `sb_flow_id`; provider redirect allowlists must preserve that query identifier on the approved callback origin. Malformed or missing explicit flow storage never falls back to another flow. Rate limits and service failures are reported without exposing account-existence details. Password updates require a recent session and existing MFA, then sign out all devices. Losing an authenticator does not enable a recovery bypass. Before any real onboarding, establish a named support owner and an independently verified identity-review procedure for provider-side factor reset, with evidence, dual review where appropriate, and session revocation. No application endpoint resets another person's MFA.

First administrator and platform operator registration are controlled bootstrap operations. There is no public bootstrap route, implicit platform superuser or officer-title shortcut. Verify legal onboarding authority, identify a second administrator for handover, review the scoped records and use a separately approved operations procedure. Do not run test fixtures or use a database-owner login as a resident/staff account.

## Support and private files

Support is disabled by default. An association-wide administrator may explicitly approve a different pre-registered operator for at most sixty minutes, with a reason. The account context labels that access as support-only. It permits association/community metadata, not properties, private files, financial data, role changes or impersonation. Audit history shows approval and revocation; removal of the approver's authority also invalidates the grant. Emergency impersonation remains disabled.

Direct client storage reads/writes and signed URL creation are denied. The download API checks current identity, membership, property/audience and clean scan state before serving an attachment. Owner-only evidence is withheld from ordinary occupants. Default audience is administrator-only. A server-only key performs the already-authorized object read and is never included in a client response. Upload/scanning/version/retention workflows are S05; there is no production malware scanner in S02.

## Operational checks and rollback

Before hosted enablement, verify HTTPS/proxy origin handling, redirect allowlists, SMTP delivery, email confirmation, MFA, sign-in/recovery abuse controls, runtime secrets, first-admin bootstrap and security review. Provider rate limits exist, but edge controls and shared-egress tuning remain required before production. Do not publish an SLA or security certification from CI results.

For a suspected authorization issue, close the account service through the hosting control plane and revoke S02 RPC execution from `authenticated` using a reviewed forward repair. Revoke affected provider sessions and memberships. Preserve audit and operation records; do not drop identity tables or rewrite old migrations. After containment, verify API, direct RPC/database and private-file denial before reopening. No production control-plane action is authorized by this document.

Engineering contracts and sources: [ADR 0005](architecture/adr/0005-identity-and-access.md), [S02 evidence](delivery/evidence/S02.md), [development setup](development.md).
