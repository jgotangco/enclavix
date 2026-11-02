# ADR 0004 API compatibility and additive migrations

Date: 1 November 2026. State: engineering design for S01; production support windows require product approval. Owners: architecture and operations leads. Requirement: ARC 03.

Use an `/api/v1` boundary shared by web and Android. Add optional fields without repurposing existing fields or enum meanings. Breaking contracts require a new API version and a documented client transition. Prefer decimal strings, ISO timestamps with offsets and stable IDs over locale-formatted values. Unknown optional response fields must be tolerated by supported clients; unknown security-sensitive commands must be rejected server-side.

Proposed future compatibility policy: preserve a replaced API version for at least 180 days, with published deprecation dates and usage telemetry. This is not yet a customer commitment. S06 must approve the initial app support matrix, capability negotiation and authenticated minimum-version response. Critical security restrictions may require immediate server-side enforcement; do not wait for a Play rollout to revoke access. Offline caches may not claim up-to-date entitlement.

## Schema evolution
S01 adds `20261101000000_tenant_domain.sql` without changing the accepted S00 migration. Private `app` data and prototype `public` data coexist, with access denied. Do not backfill prototype demo records into production tenants. The legacy handwritten `database.ts` remains demo-only; new types are generated from applied PostgreSQL catalogs into `domain.generated.ts`.

The generator emits JSON transport shapes, maps decimals/bigint to strings, and disallows writing generated object paths. Timestamp fields describe serialized ISO values, not an unchecked cast of raw pg Date objects. S02 adapters must serialize dates and preserve exact decimal values. These are project transport types, not a claim that every old prototype type or a Supabase SDK relationship map is generated.

Run `npm run types:domain` after migration changes and `npm run types:check` in CI. The real local Supabase check independently compares its PostgreSQL catalog to the same committed output, preventing PGlite/real-database drift.

## Cutover and recovery
For any real installation: inventory existing migration history, grants, rows and attachments; map units, memberships and financial opening balances with tenant approval; stage and reconcile; preserve old records through explicit retention/cutover policy. Do not edit an already-applied migration or silently infer a tenant for old rows.

Deploy expand-compatible migrations first, then compatible services/clients, then approved backfill and verification, then remove old fields only after the support window. Roll back application changes only while contracts remain compatible. A destructive schema downgrade or data loss is not a rollback strategy: use forward repair or a tested database/object restore with reconciliation. S01 has no destructive down migration and no production cutover.
