# Prototype baseline

Source reviewed: `main` at `d150f8b3a84b77a53c9f1136434481ed544d4067`, 31 October 2026. Findings are static-source observations, not claims about a live deployment. Antigravity must reproduce and update them against its actual checkout.

| ID | Confirmed source issue | Location | Delivery owner |
| --- | --- | --- | --- |
| B01 | Client demo role bypasses session verification; login does not verify passwords | `src/lib/supabase/middleware.ts`, `src/app/login/page.tsx`, `src/components/role-switcher.tsx` | S00 containment; S02 replacement |
| B02 | No RLS enablement or policies in supplied migration | `supabase/migrations/20260822000000_initial_schema.sql` | S01 and S02 |
| B03 | Literal escaped text breaks TSX and SQL syntax | billing page, role switcher, initial migration | S00 |
| B04 | Business changes mostly use local React state and mocks | `src/app/`, `src/lib/data/mock-data.ts` | S03 through S09 |
| B05 | Resident workflows hardcode one property | `src/app/resident/` | S03 |
| B06 | Gate kiosk uses fixed clearance cards; check-in ignores validity window | `src/app/guard/page.tsx`, `src/app/guard/visitors/page.tsx` | S08 |
| B07 | Password changes and recovery report simulated success; logout only clears demo cookies | login, layouts and password modals | S02 |
| B08 | Schema, types and seed diverge; seeded profile IDs require matching auth users | `src/types/database.ts`, migration, seed | S00 clean fixture; S01 domain rebuild |
| B09 | Docker uses npm ci without tracked lockfile, copies missing public directory; Cloud Build omits Supabase build args | `Dockerfile`, `cloudbuild.yaml`, `package.json` | S00 |
| B10 | Financial posting, fine allocation and receipt sequences lack durable controls | `src/app/admin/billing/page.tsx` | S04 |
| B11 | Vaccine reference date is fixed; amenity conflicts are not enforced | pet and amenity pages | S09 |

No deployed grants, storage policies, data leakage or installed dependency CVEs were verified. Resolve actual deployment inventory before migrating any real users. Do not use live resident information to reproduce these issues.

## S00 engineering baseline selected on 31 October 2026

Node 24 LTS and Next.js 16 replace the unsupported Node 20 / Next.js 14 baseline. Exact dependency versions are recorded in package.json and package-lock.json. Current selection: Node 24 major, Next.js 16.4.3, React 19.3.1, ESLint 10.14.0. Supabase remains a candidate for S02 identity; its application clients are disabled in S00. SQL execution in PGlite is separate from the local Supabase Auth/API integration check.

Official references verified on 31 October 2026:
- https://nodejs.org/en/about/previous-releases
- https://nextjs.org/support-policy
- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://supabase.com/docs/reference/javascript/auth-admin-createuser
- https://supabase.com/docs/guides/local-development/cli/config

S00 uses the Next.js Node proxy convention, explicit ESLint CLI, and the webpack build path. No Google font download is required during build. Mock demos accept no backend credentials; production portals and authentication callbacks remain closed until real identity and persistence are delivered. Local and CI results are recorded in evidence/S00.md; documentation is not a substitute for execution.
