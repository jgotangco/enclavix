# ADR 0007: Receivables and manual payment verification

Status: S04 implementation design in progress, 3 November 2026. Only the standalone calculation primitive is implemented in this initial increment. The services and records below are planned, not available capabilities. D06 synthetic defaults are approved; association production policies remain pending.

## Calculation contract

Transport money, rates and dimensions as decimal strings. Never use JavaScript floating point for posting. `src/lib/finance/assessment.ts` uses integer arithmetic with eight fractional input places and rounds half-up once per charge to two places. Totals sum the rounded lines. Inputs reject signs, exponents, whitespace, leading zero ambiguity, nonfinite values and excess precision. The supported amount ceiling is 999,999,999,999.99; larger products/totals fail explicitly. Dimensions distinguish fixed, lot area, floor area, ownership share and whole asset quantities. Missing dimensions are errors; share values must be in (0,1].

This helper is not an authorization boundary. Future posting must load approved effective rule revisions and property/asset dimensions in trusted SQL, recompute the same result with PostgreSQL numeric arithmetic and persist formula/version/input snapshots. Client previews cannot supply final posted amounts. Golden test cases must cover both implementations before posting is exposed. Discounts/penalties require their own explicit policy and calculation tests; they are not implemented by passing signed rates into this helper.

## Planned durable boundary

- Add private app-schema finance tables with composite association/community/property references and default-deny grants. Existing public prototype invoices are not a migration source or ledger.
- Effective-dated policy/rule revisions carry preparer, independent approval, reason and audit. Tenant-set monetary limits are explicit; no implicit unlimited approval or small-association self-approval exception.
- Generation freezes the approved rules and eligible property inputs for a period. Unique business keys prevent duplicate property/rule/period charges. Preview totals reconcile to posted results. Bounded chunks resume only missing work and preserve immutable completed snapshots.
- An append-only subledger records charges, payments, allocations, credits, refunds, adjustments and linked reversals. Balances derive from entries; mutable browser balances are never authoritative. Reversals preserve original records, allocation links and acknowledgment numbers.
- A payment submission is pending evidence, never a paid statement. Staff review normalized references/amount/date/method and duplicate candidates, record a decision, then independently approve within configured limits. Retry keys bind actor, operation and canonical payload; business uniqueness also protects retries using a new key.
- Allocations name eligible charges explicitly and cannot exceed the payment's available credit or the charge's outstanding amount. Overpayments remain visible unapplied credit. Fine sources have unique durable allocation keys; discounts, waivers and disputed amounts remain independently auditable.
- Closed community-local periods reject backdating/posting. Approved reopen actions retain actor/reason/history. Receipt sequences are tenant-scoped, controlled and never reused after void/reversal. Documents say payment acknowledgment until the relevant finance owner approves different terminology.
- Proof objects remain private and quarantined until validated/scanned, with upload bounds, metadata binding and reauthorization on every download. Do not enable proof submission until this full path is verified. S05 general documents do not excuse missing S04 proof controls.
- Opening-balance imports retain preview, row errors, provenance, reconciliation and independent sign-off; posting is atomic and replay-safe. Cutover requires actual finance approval before real data.

## Authorization and concurrency plan

Reuse live provider/session/membership and fresh MFA checks. Finance preparation, approval and read access are explicit permissions; association administrator alone does not imply finance approval. Platform/support metadata roles have no routine financial access. Resident statements/proofs require current financial entitlement, not merely occupancy. Resolve historical entitlement and officer handover explicitly before exposing historical statements.

Serialize tenant mutations with the existing advisory-lock discipline, then recheck live authorization inside the lock. Add narrower locks only with a documented ordering. Test actual two-connection races for generation, same/new-key payment approval, allocation overspend, reversal, receipt uniqueness and close-versus-post. A pure unit test or single-connection simulator is insufficient concurrency evidence.

## Reviewable S04 increments

1. Exact calculation primitives, approved synthetic-default record and explicit design boundary (current increment).
2. Private policy/rule/period/subledger schema and trusted commands, snapshots, generation recovery, allocation/reversal/close tests.
3. Private payment evidence, duplicate review, independent approval, acknowledgment sequences and opening-balance cutover staging.
4. Shared authenticated API, responsive finance/resident workflows, reconciliation/aging/exports and built-provider concurrency/browser checks.

S04 remains in progress across increments. FIN 01–08 are not complete until their full acceptance evidence passes. No deployment, tax certification, gateway, full general ledger or post-S11 feature is included.
