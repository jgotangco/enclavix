# Enclavix — HOA & Enclave Operating System

Enclavix is being rebuilt as a multi-tenant community platform with a responsive web front end and an Android app for independent village and condominium associations.

**Current state: a contained prototype with an accepted engineering foundation. It is not approved for real resident data, financial operations or gate decisions.**

## Delivery status

As of 2 November 2026, both completed sprints are merged into `main`:

| Sprint | Status | Delivered scope |
| --- | --- | --- |
| [S00](docs/delivery/evidence/S00.md) | Accepted — [PR #1](https://github.com/jgotangco/enclavix/pull/1) | Reproducible builds, mock-demo isolation, closed production portals and default-deny prototype tables |
| [S01](docs/delivery/evidence/S01.md) | Accepted — [PR #2](https://github.com/jgotangco/enclavix/pull/2) | Private tenant domain, scoped relationships, generated types, fixtures, isolation/concurrency checks and architecture contracts |
| [S02](docs/delivery/evidence/S02.md) | In progress; pending review | Verified identity, MFA, scoped account services, invitations/approval, revocation and private download authorization |
| S03–S11 | Not started | Onboarding, durable services, Android, operating readiness and pilot acceptance |

[STATUS.json](docs/delivery/STATUS.json) is the delivery-state record. Sprint acceptance does not certify production readiness or approve unresolved hosting and mobile decisions. No production deployment or hosted migration has been performed.

## Implemented foundation and planned product

The S01 private PostgreSQL `app` schema contains 17 tables covering tenants, communities, village phase/block and condominium tower/floor structures, properties, assets, people, memberships, system roles, civic designations, effective-dated relationships, import staging, operations, outbox, audit and document metadata. Composite foreign keys reject cross-association references. All new tables deny client access by default, and the schema is not exposed through the Data API.

The existing web screens demonstrate resident, administration, finance and guard experiences using synthetic data. Demo sign-in does not verify a real password. The client-controlled `demo_user_role` cookie selects a mock persona only in explicitly configured mock-demo mode; it cannot authorize production access. Production business portals remain disabled. S02 adds real server-side authentication through `/account` and `/api/v1`; direct browser backend access remains disabled.

Dues and payment verification, documents, visitors, parking, pets and amenities remain planned durable workflows. Prototype buttons and screens are not evidence of successful financial or gate operations. The Android app is not implemented. Kotlin/Compose and React Native are compared in the [Android ADR](docs/architecture/adr/0003-android-platform.md); the final choice is pending approval and a device spike.

## Local setup

Use Node.js 24 (see `.nvmrc`) and npm with the committed lockfile. Python 3.9+ runs the delivery checks. Docker is required only for local Supabase and container verification.

```bash
git clone https://github.com/jgotangco/enclavix.git
cd enclavix
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). The example config enables the mock-only demo:

```env
ENCLAVIX_APP_ENV=demo
NEXT_PUBLIC_APP_ENV=demo
```

Do not add Supabase URL or key values in demo mode; even partial backend configuration causes build/startup rejection. Use only synthetic data. Demo edits are page-local and are not durable transactions.

For an optimized local demo build, keep the same configuration:

```bash
npm run build
npm start
```

See [development setup and containment](docs/development.md) for the separate contained-production preview and disposable local database checks. Cloud Build builds an image only; it does not deploy. Supabase and Cloud Run remain architecture candidates, with hosting region, tier and recovery commitments unresolved.

## Account and authorization foundation

S02 introduces email-verified accounts, association-approved applications, email-bound invitations, MFA for all staff roles, session inventory/sign-out, audited role changes and time-limited metadata-only support access. A civic title or demo cookie grants no production permission. Signed-out, revoked or wrong-association requests fail at trusted service/database boundaries.

The account area uses real services when configured in production mode. Business operations, new-association setup and Android delivery remain later-sprint work. Association administrators review existing verified contacts and properties; this is not yet a complete onboarding workflow. See the [identity contract](docs/architecture/adr/0005-identity-and-access.md) and [security runbook](docs/security-and-access.md).

## Verification

```bash
npm run lint
npm run types:check
npm run typecheck
npm test
python3 tests/s00_foundation.py
python3 tools/validate_delivery.py
python3 tools/test_validate_delivery.py
npm run build
node tools/check-http.mjs
```

The HTTP check uses the same environment mode as the build. `npm test` currently runs 44 checks, including forged-cookie containment, scoped foreign keys, rollback, immutable identities, document paths and default-deny access. After changing migrations, regenerate transport types with `npm run types:domain` and commit the result.

GitHub Actions verifies production and demo web builds/runtime, a container build/runtime and disposable Supabase. The database job verifies real Auth sign-in and TOTP MFA, recovery, logout/revocation, built-web cookie and native bearer requests, private storage restrictions, migration/type agreement, restricted-role access and concurrent commands. These checks use synthetic fixtures and do not deploy or certify real-world HOA readiness. See the [S01 evidence](docs/delivery/evidence/S01.md) for results and limitations.

## Documentation

- [Start here](docs/START_HERE.md): current implementation boundaries and reading order.
- [Business requirements](docs/BRD.md): web and Android product outcomes for villages and condominiums.
- [Sprint roadmap](docs/delivery/SPRINTS.md), [traceability](docs/delivery/TRACEABILITY.md) and [acceptance gates](docs/delivery/ACCEPTANCE.md).
- [Architecture](docs/architecture/README.md): domain model, API compatibility, private storage, workers and decision records.
- [Open decisions](docs/delivery/DECISIONS.md): accountable owners and pending approvals.
- [Repository instructions](AGENTS.md) and [optional Antigravity handoff](docs/antigravity/MASTER_PROMPT.md).

The historical [design specification](docs/ENCLAVIX_SDD.md) and [persona manual](docs/PERSONA_OPERATIONS_MANUAL.md) describe the prototype; they are not current operating procedures or production acceptance evidence.

## Credits and license

Product direction and design: [Jerome Gotangco](https://github.com/jgotangco). The original prototype was developed with Google Antigravity / Gemini; the S00–S02 refresh was implemented and reviewed with Codex.

Copyright © 2026 Jerome Gotangco. Enclavix is licensed under the [MIT License](LICENSE), including permission for commercial use, modification and distribution subject to its notice requirements. Third-party dependencies retain their respective licenses.
