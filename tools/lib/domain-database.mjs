import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Disposable relational database only. No listener, credentials or external services. */
export async function createDomainDatabase() {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL('../../tests/fixtures/standalone_test_auth_scaffolding.sql', import.meta.url), 'utf8'));
    const migrations = (await readdir(new URL('../../supabase/migrations/', import.meta.url))).filter(p => p.endsWith('.sql')).sort();
    for (const name of migrations) await db.exec(await readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../tests/fixtures/relational_users.sql', import.meta.url), 'utf8'));
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
