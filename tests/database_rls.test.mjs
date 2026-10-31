import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ALL_TABLES = [
  'properties',
  'profiles',
  'vehicles',
  'pets',
  'community_violations',
  'billing_settings',
  'invoices',
  'reservations',
  'visitor_passes',
  'tickets',
  'announcements'
];

async function setupDatabase() {
  const db = new PGlite();

  // 1. Load standalone test auth scaffolding (emulating Supabase auth schema)
  const scaffoldSql = fs.readFileSync(
    path.join(ROOT, 'tests/fixtures/standalone_test_auth_scaffolding.sql'),
    'utf8'
  );
  await db.exec(scaffoldSql);

  // 2. Load deployable migration
  const migrationSql = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/20260822000000_initial_schema.sql'),
    'utf8'
  );
  await db.exec(migrationSql);

  await db.exec(fs.readFileSync(path.join(ROOT, 'tests/fixtures/relational_users.sql'), 'utf8'));

  // 3. Load seed data
  const seedSql = fs.readFileSync(
    path.join(ROOT, 'supabase/seed.sql'),
    'utf8'
  );
  await db.exec(seedSql);

  return db;
}

test('Database: clean migration and seed execution on disposable PostgreSQL', async (t) => {
  const db = await setupDatabase();
  t.after(() => db.close());

  // Verify all 11 tables exist in public schema
  const tablesResult = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
  );
  const existingTables = new Set(tablesResult.rows.map(r => r.table_name));

  for (const table of ALL_TABLES) {
    assert.ok(existingTables.has(table), `Table ${table} must exist in public schema`);
  }

  // Verify expected record counts from seed
  const propCount = await db.query('SELECT count(*) FROM properties;');
  assert.equal(parseInt(propCount.rows[0].count, 10), 150, 'Must seed exactly 150 properties');

  const profileCount = await db.query('SELECT count(*) FROM profiles;');
  assert.equal(parseInt(profileCount.rows[0].count, 10), 10, 'Must seed exactly 10 demo profiles');

  const authUserCount = await db.query('SELECT count(*) FROM auth.users;');
  assert.equal(parseInt(authUserCount.rows[0].count, 10), 10, 'Must seed matching auth.users fixtures');
});

test('Database: seed satisfies foreign key constraints with no dangling references', async (t) => {
  const db = await setupDatabase();
  t.after(() => db.close());

  // Check profiles -> auth.users
  const danglingAuth = await db.query(`
    SELECT p.id, p.email FROM profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE u.id IS NULL;
  `);
  assert.equal(danglingAuth.rows.length, 0, 'No profiles may dangle without matching auth.users');

  // Check profiles -> properties (where property_id is not null)
  const danglingProp = await db.query(`
    SELECT p.id, p.email, p.property_id FROM profiles p
    LEFT JOIN properties pr ON p.property_id = pr.id
    WHERE p.property_id IS NOT NULL AND pr.id IS NULL;
  `);
  assert.equal(danglingProp.rows.length, 0, 'No profiles may dangle without matching properties');

  // Check vehicles -> properties
  const danglingVehicles = await db.query(`
    SELECT v.id FROM vehicles v
    LEFT JOIN properties pr ON v.property_id = pr.id
    WHERE pr.id IS NULL;
  `);
  assert.equal(danglingVehicles.rows.length, 0, 'All vehicles must belong to a valid property');

  // Check invoices -> properties
  const danglingInvoices = await db.query(`
    SELECT i.id FROM invoices i
    LEFT JOIN properties pr ON i.property_id = pr.id
    WHERE pr.id IS NULL;
  `);
  assert.equal(danglingInvoices.rows.length, 0, 'All invoices must belong to a valid property');
});

test('Database RLS: restricted role "anon" experiences deny-by-default on all 11 tables', async (t) => {
  const db = await setupDatabase();
  t.after(() => db.close());

  // Create unprivileged anon role and grant standard table permissions
  await db.exec('CREATE ROLE anon NOLOGIN;');
  await db.exec('GRANT USAGE ON SCHEMA public TO anon;');
  await db.exec('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;');

  // Switch session role to anon
  await db.exec('SET ROLE anon;');

  // Verify that SELECT on every table returns 0 rows despite GRANT because RLS has no permissive policies
  for (const table of ALL_TABLES) {
    const res = await db.query(`SELECT count(*) FROM ${table};`);
    const count = parseInt(res.rows[0].count, 10);
    assert.equal(
      count,
      0,
      `Table ${table} must return 0 rows to anon role under fail-closed RLS (got ${count})`
    );
  }

  // Verify that INSERT under anon is rejected by RLS violation
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO announcements (title, content, published_by)
        VALUES ('Unauthorized Test', 'Should fail closed', 'c0000000-0000-0000-0000-000000000001');
      `);
    },
    /violates row-level security policy/,
    'Anon insert to announcements must be rejected by RLS'
  );

  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO visitor_passes (property_id, visitor_name, expected_arrival, valid_until, pass_code)
        VALUES ('b1000000-0000-0000-0000-000000000001', 'Attacker', now(), now() + interval '1 hour', 'HACK123');
      `);
    },
    /violates row-level security policy/,
    'Anon insert to visitor_passes must be rejected by RLS'
  );
});

test('Database RLS: restricted role "authenticated" experiences deny-by-default prior to S02 policies', async (t) => {
  const db = await setupDatabase();
  t.after(() => db.close());

  // Create authenticated role and grant table permissions
  await db.exec('CREATE ROLE authenticated NOLOGIN;');
  await db.exec('GRANT USAGE ON SCHEMA public TO authenticated;');
  await db.exec('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;');

  // Switch session role to authenticated
  await db.exec('SET ROLE authenticated;');

  // Verify that SELECT on all 11 tables returns 0 rows (no permissive policies exist yet)
  for (const table of ALL_TABLES) {
    const res = await db.query(`SELECT count(*) FROM ${table};`);
    const count = parseInt(res.rows[0].count, 10);
    assert.equal(
      count,
      0,
      `Table ${table} must return 0 rows to authenticated role in S00 (got ${count})`
    );
  }

  // Verify that INSERT under authenticated role is also blocked fail-closed
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO tickets (property_id, created_by, subject, description)
        VALUES ('b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Leak', 'Pipe leaking');
      `);
    },
    /violates row-level security policy/,
    'Authenticated role insert without policies must be rejected by RLS'
  );
});
