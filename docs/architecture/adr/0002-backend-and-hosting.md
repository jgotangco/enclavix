# ADR 0002 Shared backend and hosting recommendation

Date: 1 November 2026. State: recommendation; D03 remains proposed. Owners: architecture, privacy and operations leads. Requirements: ARC 01–03, REL 01/03, NFR 01–06.

Recommend retaining PostgreSQL and evaluating managed Supabase Auth/Database/Storage with a shared versioned service API implemented beside the Next.js web application. Android calls the same API. Candidate web hosting remains a container service such as Cloud Run; background execution uses an explicit worker/job lifecycle. S01 creates no cloud service, purchased plan, credentials or deployed endpoint.

| Option | Benefit | Cost or risk to resolve |
| --- | --- | --- |
| Managed Supabase plus container API | Reuses current PostgreSQL, auth and container foundation; common service contract for web and Android | Region compatibility, connection pooling, auth assurance, private storage, backup tier, export and restore tests, egress and support cost |
| Managed PostgreSQL and separately managed identity/storage | More independent provider choices | More integration, operational ownership and incident boundaries |
| Dedicated stack per association | Stronger physical separation and tenant-specific recovery/region options | More environments, migrations, monitoring and recurring cost; still needs logical authorization |

No hosting bill or recovery guarantee is approved. Before choosing a production region/plan, inventory expected units, evidence volume, upload/egress traffic, concurrent guard use and recovery needs. Compare a baseline and peak-load monthly cost including database/PITR, storage, API/worker compute, networking, email/push delivery, logs, support and test environments. Obtain current provider quotes and a privacy/residency review rather than inventing price estimates.

The API must use restricted database roles with verified identity and tenant context; do not send a service-role key to clients or use a general superuser connection for ordinary commands. The S02 ADR must finalize pooled connection/session hygiene, trusted claims propagation and least-privilege roles before any API is enabled. Long-running work and private evidence cannot depend on a single web process or its local filesystem.

Database backups do not establish file restore readiness. Test database and object restoration together, preserve referential consistency, and obtain approved RPO/RTO evidence in S10. Vendor features and limits must be rechecked at procurement.

Sources checked 1 November 2026: [Cloud Run container contract](https://cloud.google.com/run/docs/container-contract), [Supabase backups](https://supabase.com/docs/guides/platform/backups), [Supabase custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas).
