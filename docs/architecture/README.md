# Architecture and implementation boundaries

The new domain lives in the private PostgreSQL `app` schema. Existing public tables and `src/types/database.ts` remain the isolated prototype. S01 established the domain with no application access. S02 adds narrow account services and authorization under review; operational mock portals remain isolated. No hosted deployment or worker is enabled. S04 adds synthetic financial services under engineering review; production financial operations remain unapproved.

## Decisions and contracts
- [Tenant and identity boundary](adr/0001-tenant-boundary.md) — enforced foundation, D01/D02 business assumptions still proposed.
- [Backend and hosting](adr/0002-backend-and-hosting.md) — recommendation for D03, no hosting or purchase approval.
- [Android comparison](adr/0003-android-platform.md) — recommendation for D04, stack approval and device spike still required in S06.
- [API and migration compatibility](adr/0004-api-and-migrations.md) — versioning and cutover design for ARC 03.
- [Domain and invariants](domain-model.md).
- [API and transaction boundary](service-contracts.md).
- [Workers and private documents](workers-and-storage.md).

These documents distinguish implemented database constraints from future application enforcement. None of them represents regulatory certification, a production release, financial posting acceptance, or an independent security assessment.

Accepted S02 identity and review repairs: [identity and authorization contract](adr/0005-identity-and-access.md). S02 adds accepted account/access services and review repairs while retaining mock portal containment.

Accepted S03 scope: [onboarding and registry contract](adr/0006-onboarding-and-registry.md). Its historical migration baseline contained 26 tables; synthetic sandbox activation does not approve real resident data or deployment.

S04 finance implementation under verification: [ADR 0007](adr/0007-receivables-and-verification.md) and [finance API](../finance-api.md). The current S04 schema has 36 private app tables; accepted S03 evidence retains its historical 26-table count. No production finance, scanner or deployment approval is implied.
