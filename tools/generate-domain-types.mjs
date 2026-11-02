import { readFile, writeFile } from 'node:fs/promises';
import { createDomainDatabase } from './lib/domain-database.mjs';
import { renderDomainTypes } from './lib/domain-catalog.mjs';

const db=await createDomainDatabase();
try {
  const generated=await renderDomainTypes(db);
  const path=new URL('../src/types/domain.generated.ts',import.meta.url);
  if (process.argv.includes('--check')) {
    if (await readFile(path,'utf8')!==generated) throw new Error('Domain types are stale; run npm run types:domain');
    console.log('Generated domain types match applied migrations');
  } else {
    await writeFile(path,generated);
    console.log('Generated src/types/domain.generated.ts from applied PostgreSQL catalogs');
  }
} finally { await db.close(); }
