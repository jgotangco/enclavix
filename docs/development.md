# Local development and S00–S02 boundaries

Use Node 24 (`nvm use`) and run `npm ci`. Copy `.env.example` to `.env.local` for the mock-only demo, then run `npm run dev`. Run `npm run build` for a production-optimized demo build. The build tool loads local env files through Next's environment loader; startup validates the same mode rules.

## Deployment modes
- Demo: ENCLAVIX_APP_ENV=demo and NEXT_PUBLIC_APP_ENV=demo. Omit all Supabase URL/key/service-key values. Demo cookies select synthetic personas only. Changes are page-local and not real transactions.
- Contained production preview: both mode values production; a valid HTTPS Supabase URL and public key are required to build. S02 initializes real per-request server Auth clients for `/account` and `/api/v1`. Mock business portals still redirect to login. Direct browser backend clients remain disabled. Configure URL/public key at runtime as well as build time; container startup fails without them.
- Missing/conflicting mode or backend credentials in a demo fail build/startup. Public mode values are compiled by Next; changing them requires rebuilding the image. Do not reuse a demo build as a production release.

The legacy demo enable/isolation flags have no authority. URL names, paths or query strings cannot establish database isolation. No .env files are copied into container builds. Cloud Build now builds an image only; it does not deploy a service.

## Verification
Run `npm run lint`, `npm run types:check`, `npm run typecheck`, `npm test`, `python3 tests/s00_foundation.py`, `python3 tools/validate_delivery.py`, and `python3 tools/test_validate_delivery.py`. After a build run `node tools/check-http.mjs` with the same server mode. The HTTP check starts and stops a temporary loopback listener and verifies actual built-server route responses.

CI verifies both production and demo builds, a production container build/runtime and local Supabase Auth/API behavior. It never deploys or uses hosted project secrets.

## Disposable local Supabase
Requires Docker. Run `npm ci`, `npx supabase start -x realtime,edge-runtime,logflare,vector,supavisor`, then `npx supabase db reset --local --no-seed`. These commands reset only the local development stack; never add --linked or a hosted DB URL.

Build the production-mode account application with synthetic configuration as in the CI Supabase job, then run `node tools/check-local-supabase.mjs` immediately after the reset. It reads the local CLI status internally, refuses any endpoint other than 127.0.0.1 on the expected ports, creates synthetic users with random passwords through the Admin API, confirms sign-in, maps actual user IDs into the local relational seed, and checks denied prototype API access. It also exercises real TOTP, recovery, private storage, application/support approval and revocation, two-connection authorization races, and a built web server with cookie/native requests. Mail capture and storage stay local; no outgoing real email is used. It never prints keys or passwords. Re-running requires a fresh local reset. Stop with `npx supabase stop --no-backup`.

`tests/fixtures/standalone_test_auth_scaffolding.sql` and `relational_users.sql` are PGlite relational fixtures, not usable authentication accounts. They are never deployable migrations. `supabase/seed.sql` requires users already provisioned by the local verification script and automatic seeding is disabled. Never apply synthetic seeds to a real association.


## S01 domain foundation
The new private `app` schema is additive to the prototype. No ordinary role can access it and it is not exposed by the Data API. Domain fixtures are loaded only by disposable test tools.

After editing migrations run `npm run types:domain`; commit `src/types/domain.generated.ts`. CI runs `npm run types:check`, and local Supabase verification independently compares real PostgreSQL catalogs to that file. The generator maps exact numeric/bigint values to strings and timestamps to serialized strings. Do not cast raw pg Date/numeric values to these types without the future API adapter.

`npm test` includes tenant-domain invariants. The local Supabase verification also seeds both community forms, verifies scoped references and RLS, and uses two independent connections to race the same operation key. It still refuses any hosted database. See `docs/architecture/README.md` for the domain model, proposed decisions and later-sprint enforcement work.

## S02 account verification

Use the account UI for sign-in, verification/recovery, authenticator setup, approved association context, invitations, applications and session removal. An administrator must already be bootstrapped through a controlled process; no HTTP endpoint creates the first administrator. Registry creation and full association onboarding belong to S03. See `docs/security-and-access.md`.

The private `app` schema now contains 21 tables. Normal API roles still have no table privileges; named public RPCs are the access boundary. `enclavix_reader` is NOLOGIN/NOBYPASSRLS and cannot be assumed by client roles. Privileged helper/command functions are separately constrained and audited. The service key is optional for account functions and required only for authorized private downloads; provide it as runtime `SUPABASE_SERVICE_ROLE_KEY`, never a build argument or NEXT_PUBLIC value.

Integration tooling opts into `ENCLAVIX_LOCAL_AUTH_TEST=1` only for the exact `http://127.0.0.1:54321` disposable endpoint. Do not configure it for hosted deployment. The built application's public mode must match its server mode; production and demo are separate artifacts. Temporary HTTP tests manually manage Secure cookies; actual deployment requires HTTPS and browser verification.

## S02 review regression checks

`npm test` includes the four review regressions and their negative cases (58 total checks). After a production-mode build, `node tools/check-account-repairs.mjs` starts a temporary built app and a synthetic Auth server at `127.0.0.1:54321`, using the actual SDK and cookie adapter. It checks provider 429/503 handling, enumeration-safe responses and overlapping email/PKCE callbacks. It refuses an occupied provider port and never stops an existing local stack. This test is also wired into the production web CI job; it is separate from actual Supabase/GoTrue verification. Do not run it while the local Supabase stack owns that port. No real email or hosted endpoint is used.
