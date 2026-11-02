# ADR 0001 Tenant and identity boundary

Date: 1 November 2026. State: implemented as a reversible S01 engineering foundation; D01 and D02 remain proposed business decisions. Owners: product sponsor and architecture lead. Requirements: TEN 02–04, IAM 03/05/07, ARC 01.

## Recommendation and rationale
Use one legal association as the tenant boundary, with one or more communities owned by it. Communities have village or condominium forms; common terminology is configured with labels rather than tenant-specific code branches. PHP, en-PH and Asia/Manila are initial defaults, not hard limits; currency and timezone are stored per tenant, and each community has an explicit timezone.

An authenticated principal is global in Supabase Auth, but contact records are scoped to each association. One person can therefore have separate `app.people` records linked to the same verified auth ID in two associations. Do not match or merge records on email alone. A legal organization can own property and authorize a separate representative; it cannot itself have a login binding.

A membership is a stable person/association relationship with status and a half-open validity window [valid_from, valid_until). Roles and civic designations are separate, effective-dated records. A president receives no administrator rights automatically. Staff working for a management company need explicit memberships and role grants in each association; a management-company label grants nothing.

## Implemented boundary
The additive migration creates private `app` tables. Tenant-owned foreign keys include tenant ID, and community-owned property/asset links include community ID. Contact records, role actors, import rows, operation/outbox records, audit events and document metadata cannot reference another association. Tenant identity is immutable. Location ancestry is immutable: parents must exist at insertion, so neither reparenting cycles nor concurrent cycle creation are possible. Rename labels/codes in place; a future structural move needs a reviewed create/retire workflow.

`app` is absent from Data API exposed schemas. Schema/table/function privileges are revoked from public, anon, authenticated and service_role. Every table has default-deny RLS with no policies. Tests deliberately grant DML temporarily to prove RLS still denies reads and writes. Database owners/superusers can bypass RLS and alter schema; owner credentials are never application credentials.

## Deferred controls and approval
Identity verification, membership approval, MFA, role/record policies, temporal entitlement resolution and support access arrive in S02/S03. A stored relationship, auth-user link or civic title is not yet a permission grant. No application accesses the new schema in S01. Cross-HOA integrations such as a separately operated mother-village gate require an explicit integration contract, not cross-tenant foreign keys.

Before pilot activation the sponsor must confirm legal association boundaries, condominium terminology, onboarding authority and privacy responsibilities. Alternative dedicated databases per association remain available if residency or operational requirements justify their cost. The shared-schema foundation is not a promise to host every future tenant in one database.

Sources checked 1 November 2026: [PostgreSQL constraints](https://www.postgresql.org/docs/15/ddl-constraints.html), [row security](https://www.postgresql.org/docs/15/ddl-rowsecurity.html), [Supabase custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas).
