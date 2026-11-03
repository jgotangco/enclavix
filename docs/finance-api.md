# Finance service and operating contract (S04)

Engineering scope uses synthetic data only. Per-association D06 accounting approval, production storage/scanner configuration, privacy, recovery and pilot acceptance remain required before real use. `/finance` is the responsive workspace; old mock billing portals remain isolated. No gateway, funds transfer, general ledger or official tax receipt is provided.

## Authorization and requests

The shared `/api/v1/finance/*` API accepts provider-verified cookie sessions or native bearer tokens. Cookie mutations require same-origin JSON. Responses use private/no-store; downloads force attachment and sandbox content. Unknown fields/routes and oversized bodies fail. Every mutation requires an `Idempotency-Key` bound to actor and canonical payload. Finance writes acquire the existing tenant advisory lock, then recheck live membership, assigned community scope, MFA and a sign-in less than ten minutes old.

Preparation needs `finance_preparer`; decisions need a different `finance_approver`. Administrator, platform and support roles alone have no finance permission. An approval limit must be proposed and independently approved for each community before financial approvals. The limit applies to gross absolute batch amounts, not a net total that could conceal large offsetting charges/credits. Policy bootstrap/change also needs two explicitly assigned finance identities. No unlimited default or self-approval exception is enabled. Board reviewer has read-only scoped reporting.

Residents need current ownership, a current valid owner representation or an explicit billing-responsible relationship. Occupancy alone grants no financial view. Historical rows additionally require entitlement by the entry's community-local date; a new owner cannot read a predecessor's statements. Ended relationships lose access immediately. Resident reports omit staff review/audit payloads. Historic liability transfers are not automatic: finance owners must approve a documented cutover and explicit adjustments before real transfer use; the registry never silently moves or rewrites posted debt.

## Named operations

| Operation | Body / behavior |
| --- | --- |
| GET `index` | Current authorized associations, communities, roles and properties |
| POST `prepare` | `p_tenant,p_community,p_kind,p_data,p_reason`; immutable proposal and preview |
| POST `decide` | `p_tenant,p_request,p_approve,p_reason`; independent final approval/rejection, atomic effects |
| POST `generate` | `p_tenant,p_batch,p_limit,p_reason`; 1–1,000 approved frozen lines per transaction; resume missing lines |
| POST `opening_preview` | `p_tenant,p_community,p_rows,p_reason`; 1–1,000 rows, row errors, reconciliation and canonical parsed-row SHA-256 |
| POST `upload` | `p_tenant,p_property,content_type,base64`; server authorizes, scans and writes private proof; maximum 5 MiB decoded |
| POST `submit` | `p_tenant,p_property,p_data`; amount/date/method/reference/clean own document; pending only |
| GET `{tenant}/proof/{document}` | Reauthorize private proof; hash/size verify, audit and attachment stream; no signed URLs |
| GET `report` / `export` | Query `tenant,community,property?,from,until`; JSON report/export, ISO dates, maximum 367 inclusive days |

`prepare` kinds: policy, rule, generation, payment review, charge, credit, allocate, refund, reverse, dispute, resolve, close, reopen and opening import. The database independently allowlists each kind's payload keys. Monetary fields are decimal strings. Report entry list is capped at 1,000 with explicit truncation and an exact full summary; export refuses truncated entries, so narrow the date/property range. Request review shows the latest 100 proposals; older finance/audit history remains retained in the database. No retention or deletion schedule is approved by S04.

## Ledger and assessment semantics

Approved monthly rules use effective month boundaries; mid-month proration is not silently invented. Fixed, lot/floor area, ownership-share and distinct current asset quantities use approved rates and database-loaded dimensions. Missing dimensions fail preview. Special and pass-through charges use the same audited rule process; nonrecurring rules apply in their effective month only. Discounts are signed credits. Penalties use outstanding, overdue, undisputed debit balances, approved grace days, percentage and per-property/period cap. Snapshots preserve rate, quantity, rule, category and period. A later rule cannot recalculate an existing snapshot. Rejected snapshots remain retained and cancelled; a replacement can be prepared without reusing their history.

All amounts use exact PostgreSQL numeric. The TypeScript preview primitive uses integer arithmetic; both round half-up once per charge to two places. Totals sum rounded lines. Maximum line or total is 999,999,999,999.99; overflow fails. Generation freezes eligible properties/inputs and reconciliation totals before approval; each property/rule line posts once across retries and resumable chunks.

Debits increase receivables; payment/credit entries reduce them. Allocations explicitly link a debit and credit on the same property, cannot overspend either, and do not change the net ledger balance. Unallocated excess remains visible credit. Refunds consume only available credit and create a linked debit record; the operator separately handles any real transfer outside this synthetic system. Reversals append opposite entries and allocation reversals without deleting history. They cannot precede source/allocation history. Tenant-scoped payment acknowledgment sequences are never reused; reversed acknowledgments remain numbered and show void status. Duplicate fine keys cannot create another charge. A formally reassessed fine requires a new decision/source key and an explicit `reassessment_of` link to the reversed fine on the same property; that original fine can be reassessed only once. Routine generation cannot recharge the old key.

Current balances, dated opening/movement/closing totals, as-of allocation balances, aging, gross payment registers and daily reconciliation derive from entries. A closed period rejects posting/backdating until independently approved reopening. Incomplete generation prevents closing. Opening CSV uses `property_id,amount,direction`; rows reconcile against the signed expected total and retain source key, canonical row hash, optional file hash and sign-off reference. Duplicate source/property posting fails. Source preview/sign-off does not certify legacy data accuracy or tax compliance.

## Proof storage and scanner deployment contract

Private `tenant-private` storage keeps direct client reads, writes and signed URLs denied. Proof metadata is bound to tenant/property/uploader/hash/type/size. General document authorization explicitly excludes payment proofs, preventing administrator-only roles from bypassing finance permissions. Repeated upload/submission after a lost response reuses immutable evidence and business identity; changing its bound payment data conflicts. Review surfaces normalized reference, matching hash and method/date/amount duplicate candidates within the reviewer's authorized scope. Independent reviewers record their findings; candidate matches are not silently treated as confirmed fraud or successful settlement.

Server-only environment settings:

- `SUPABASE_SERVICE_ROLE_KEY`: existing private storage capability, never a public variable.
- `ENCLAVIX_SCANNER_URL`: operator-controlled HTTPS scan endpoint, no credentials/query/fragment in URL; redirects are rejected.
- `ENCLAVIX_SCANNER_TOKEN`: private bearer credential for that endpoint.

The server sends bounded raw bytes, their content type and `X-Content-SHA256`. Scanner returns JSON `{ "sha256": "<matching hash>", "verdict": "clean" | "infected" }` within 15 seconds and 4 KiB. Missing configuration, bad response/hash, outage or unknown verdict fails closed. Signature/type checks supplement the scanner; they do not replace malware detection. Only the privileged server completion RPC can mark proof clean. Scanner trust, malware-engine efficacy, data residency, availability, credentials and operations must be validated before deployment; no vendor/service purchase is selected or approved. CI uses a clearly synthetic scanner stub to test this protocol, not to claim malware-engine effectiveness. Loopback HTTP is allowed only under the existing explicit local Auth test flag.

## Compatibility and rollback

Two additive S04 migrations create ten private tables (36 total app tables), plus proof-purpose metadata and narrow functions. Existing public prototype invoices are untouched. Catalog types are regenerated. Earlier merged migrations are unchanged. Containment is revoking finance RPC execution; any applied-data repair must be reviewed and forward-only, preserving ledger, allocations, numbering and audit. No destructive down migration, live migration or deployment is authorized.

Implementation references: ADR 0007, `docs/delivery/evidence/S04.md`, `tests/finance_ledger.test.mjs`, `tests/finance_proof.test.mjs`, `tools/lib/verify-finance.mjs` and the built API verification. Official APIs checked 3 November 2026: [Supabase upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [private storage access control](https://supabase.com/docs/guides/storage/security/access-control), [PostgreSQL exact numeric](https://www.postgresql.org/docs/15/datatype-numeric.html). No dependency upgrade was introduced.
