# Workers and private storage plan

## Durable delivery
`operation_requests` and `outbox_events` provide transaction and uniqueness primitives. A future worker must lease due rows in a short transaction using row locks and SKIP LOCKED, set a lease token/expiry, and update outcomes only when the lease token still matches. Process with bounded retries/backoff, reclaim expired leases, dead-letter after a configured limit, and expose lag/failure metrics. Handler deduplication by event ID is required because delivery is at least once. S01 has no queue consumer and does not claim exactly-once external delivery.

The worker identity must have narrow grants and audited tenant context, not a client role or a general database superuser. Apply the same tenant ownership when generating exports, scheduling dues, scanning files or sending notifications. Derive recipients from authorized records, not an untrusted event payload that names another HOA. Never put credentials or unrestricted private URLs in event payloads, logs, lock-screen push or email.

## Private objects
`document_objects` stores tenant/community/property references, uploader membership, content metadata, checksum, pending scan status and a generated tenant/object path. It never persists public URLs. S02 adds a private bucket, document audiences and a live-authorized download proxy. All direct client object access and signed URL creation remain denied so a link cannot outlive revocation. Upload quarantine, scanning, versioning and retention remain S05.

Upload workflow: authorize context, create pending metadata with server-generated IDs, issue a bounded upload grant for that exact path, verify size/type/checksum, scan in quarantine, and mark clean only through a trusted scanner result. Reject or quarantine mismatches. Never make a file readable merely because a client says an upload succeeded. Download and export must reauthorize every record, enforce scan/retention state, and serve through a live-authorized proxy. Any future temporary upload grant must have narrowly bounded scope and expiry. An object path prefix is defense in depth, not proof of authorization.

Deletion requires approved retention/legal-hold logic and coordinated database/object handling. Restore exercises must check objects as well as rows; a restored database that points to missing evidence is not a successful recovery. App-local filesystem writes are temporary and cannot be the only evidence copy. Dedicated storage/worker load, region and recovery design remain D03/S10 decisions.

No live bucket, worker, external delivery channel or secret was configured in S01.

S02 creates the bucket only when migrations run in a disposable Supabase database; no hosted bucket was configured. The server-only storage credential is used solely after metadata authorization, with a 20 MiB bucket/proxy bound, attachment disposition and private/no-store responses. Default audience is administrator-only; owner/representative and occupant audiences require explicit metadata and current property entitlement. See ADR 0005.
