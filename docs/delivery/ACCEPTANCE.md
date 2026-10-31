# Acceptance and review contract

## Every delivered feature
Requirement IDs and user-visible scope are explicit. Positive, unauthorized, wrong-tenant, duplicate/retry, failure and concurrency paths are tested where relevant. Data is durable and shared across clients. Private uploads remain private. Audit entries identify actor and tenant. Accessibility and support/error states work. Migration and compatibility impact is documented. Tests use synthetic data.

## Release gates
G1 clean build/migrations/CI/rollback; G2 trusted identity and tenant isolation; G3 reconciled finance; G4 cross-channel user journeys; G5 restore, operations and privacy; G6 real village/condominium pilot acceptance; G7 gate validation if enabled. Detailed measures and named acceptance roles are in BRD section 10.

## Minimum evidence
Record environment, commit, commands, observed results, dates, fixtures, device and network profiles where relevant, failures and unrun checks. Link test code and sanitized output. External penetration test, real pilot sign-off, restored-file verification, privacy policy approval and store publication cannot be replaced by assertions in Markdown.

## Review outcome
Owner may accept, request repairs or split remaining scope. Do not suppress a failing check or change an acceptance measure merely to mark done. Approved changes need rationale, actual approver, impact and updated BRD/traceability. Critical/high security findings block production; lower-risk exceptions need owner, expiry and mitigation.
