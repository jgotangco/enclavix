# S03 community API

Engineering state: in progress; sandbox-only. All routes use the existing `/api/v1` authentication contract. Cookie requests require same-origin JSON for mutations; Android/native requests use provider-issued bearer tokens. Every response is private/no-store. Server authorization is authoritative; do not derive access from a demo cookie, displayed menu, cached context or request field.

Read routes under `/api/v1/community/`:

| Path | Result / authority |
| --- | --- |
| `index` | Current authorized contexts, setup metadata and operator capability |
| `{tenant}/setup` | Checklist/configuration for a live global administrator or enabled MFA operator |
| `{tenant}/registry` | Registry for a live global administrator |
| `{tenant}/property/{property}` | Current authorized property and caller's active relationships |
| `{tenant}/import_view/{batch}` | Administrator's scoped preview, raw/validated logical rows and issues |
| `{tenant}/export/{export}` | Fresh administrator's scoped, unexpired JSON attachment |

POST routes take exactly these top-level JSON keys; every field listed is required, while optional nested fields may be omitted. Supply `Idempotency-Key` (1–128 characters, letters/numbers/`.`/`_`/`:`/`-`). Retry the exact payload with the same key after an uncertain network response. Changing the payload requires a deliberate new operation. All command reasons must have 10–1,000 characters. Fresh operator/administrator sessions are younger than ten minutes and require MFA.

| Route | JSON keys |
| --- | --- |
| `create` | `p_data`, `p_reason` |
| `settings` | `p_tenant`, `p_data`, `p_reason` |
| `submit` | `p_tenant`, `p_reason` |
| `activate` | `p_tenant`, `p_revision`, `p_reason` |
| `registry_command` | `p_tenant`, `p_action`, `p_data`, `p_reason` |
| `import_stage` | `p_tenant`, `p_kind`, `p_rows`, `p_reason` |
| `import_commit` | `p_tenant`, `p_batch`, `p_expected_hash`, `p_reason` |
| `import_cancel` | `p_tenant`, `p_batch`, `p_reason` |
| `export_create` | `p_tenant`, `p_reason` |
| `offboarding` | `p_tenant`, `p_export`, `p_reason` |

`create.p_data`: tenant_key, legal_name, administrator_email, authority_ref, currency, time_zone, locale. No auth UUID or operator/role claim is accepted. Settings accept address, brand_name, accent_color, billing_day (1–28), notification_contact, support_contact, privacy_notice_ref, opening_balance_state. Send the complete settings object; omitted fields reset to their documented defaults.

Registry actions are community, location, property, person, asset, property_update, person_update, relationship, end_relationship and transfer. Their exact nested allowlists are in the additive S03 migration; use web forms/templates as the reference client. End-relationship takes `id`. Transfers take property_id, old_person_id, new_person_id, kind (owner/tenant), and optional valid_from/valid_until and contact flags. Decimal areas/shares are strings; timestamps must include a time zone. Updates replace the supported details: blank areas/email clear their current values. Immutable identity/scope/code cannot be changed through update actions.

Import preview row objects use `row` (one-based data row), `kind`, `raw`, `validated`, `status`, `issues`; issues include their logical row number. Source fingerprints cover canonical parsed `{kind,rows}`, not raw CSV bytes. Stage permits 1–1,000 rows and a request of at most 1 MiB; other commands are limited to 8 KiB. The body limit includes JSON overhead. Unsupported imports (accounts, roles, balances, vehicles) are rejected. Commit is all-or-nothing and revalidates the registry; conflict means review and create a fresh preview.

Successful JSON responses use `{data: ...}`; failures use `{error:{code:...},request_id:...}`. The export route instead returns an attachment. HTTP statuses include 400 invalid request, 401 unverified/no identity, 403 insufficient authority/freshness, 409 state/idempotency conflict, 413 size limit, 415 JSON required and 503 unavailable. Error responses do not disclose database/provider details. Do not automatically repeat a changed approval or reuse another account's pending request state.

See [ADR 0006](architecture/adr/0006-onboarding-and-registry.md) for independent approval, transfer, export, staging and migration limitations. These routes do not implement financial posting, full offboarding or a production data activation policy.
