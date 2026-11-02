# S01 architecture baseline

The new domain lives in the private PostgreSQL `app` schema. Existing public tables and `src/types/database.ts` remain the isolated prototype. No production endpoint, database policy, worker or storage bucket is enabled by this sprint. S00 containment remains in force.

## Decisions and contracts
- [Tenant and identity boundary](adr/0001-tenant-boundary.md) — enforced foundation, D01/D02 business assumptions still proposed.
- [Backend and hosting](adr/0002-backend-and-hosting.md) — recommendation for D03, no hosting or purchase approval.
- [Android comparison](adr/0003-android-platform.md) — recommendation for D04, stack approval and device spike still required in S06.
- [API and migration compatibility](adr/0004-api-and-migrations.md) — versioning and cutover design for ARC 03.
- [Domain and invariants](domain-model.md).
- [API and transaction boundary](service-contracts.md).
- [Workers and private documents](workers-and-storage.md).

These documents distinguish implemented database constraints from future application enforcement. None of them represents regulatory certification, a production release, financial posting acceptance, or an independent security assessment.
