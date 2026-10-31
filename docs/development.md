# Local development and S00 boundaries

Use Node 24 (`nvm use`) and run `npm ci`. Copy `.env.example` to `.env.local` for the mock-only demo, then run `npm run dev`. Run `npm run build` for a production-optimized demo build. The build tool loads local env files through Next's environment loader; startup validates the same mode rules.

## Deployment modes
- Demo: ENCLAVIX_APP_ENV=demo and NEXT_PUBLIC_APP_ENV=demo. Omit all Supabase URL/key/service-key values. Demo cookies select synthetic personas only. Changes are page-local and not real transactions.
- Contained production preview: both mode values production; a valid HTTPS Supabase URL and public key are required to build. No Supabase client is initialized in S00 and every protected portal redirects to login. Real identity, RLS membership policies and durable workflows arrive in later sprints.
- Missing/conflicting mode or backend credentials in a demo fail build/startup. Public mode values are compiled by Next; changing them requires rebuilding the image. Do not reuse a demo build as a production release.

The legacy demo enable/isolation flags have no authority. URL names, paths or query strings cannot establish database isolation. No .env files are copied into container builds. Cloud Build now builds an image only; it does not deploy a service.

## Verification
Run `npm run lint`, `npm run typecheck`, `npm test`, `python3 tests/s00_foundation.py`, `python3 tools/validate_delivery.py`, and `python3 tools/test_validate_delivery.py`. After a build run `node tools/check-http.mjs` with the same server mode. The HTTP check starts and stops a temporary loopback listener and verifies actual built-server route responses.

CI verifies both production and demo builds, a production container build/runtime and local Supabase Auth/API behavior. It never deploys or uses hosted project secrets.

## Disposable local Supabase
Requires Docker. Run `npm ci`, `npx supabase start -x realtime,edge-runtime,logflare,vector,supavisor`, then `npx supabase db reset --local --no-seed`. These commands reset only the local development stack; never add --linked or a hosted DB URL.

Run `node tools/check-local-supabase.mjs` immediately after the reset. It reads the local CLI status internally, refuses any endpoint other than 127.0.0.1 on the expected ports, creates 10 synthetic users with random passwords through the Admin API, confirms sign-in, maps actual user IDs into the local relational seed, and checks denied API access. It never prints keys or passwords. Re-running requires a fresh local reset. Stop with `npx supabase stop --no-backup`.

`tests/fixtures/standalone_test_auth_scaffolding.sql` and `relational_users.sql` are PGlite relational fixtures, not usable authentication accounts. They are never deployable migrations. `supabase/seed.sql` requires users already provisioned by the local verification script and automatic seeding is disabled. Never apply synthetic seeds to a real association.
