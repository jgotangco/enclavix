/** Deterministic PostgreSQL catalog -> TypeScript boundary types. No hand-maintained column list. */
export async function renderDomainTypes(db) {
  const columns = (await db.query(`
    SELECT c.relname AS table_name,a.attname AS column_name,t.typname AS type_name,
           ns.nspname AS type_schema,a.attnotnull AS is_not_null,a.atthasdef AS has_default,
           a.attgenerated AS generated
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_type t ON t.oid=a.atttypid
    JOIN pg_namespace ns ON ns.oid=t.typnamespace
    WHERE n.nspname='app' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped
    ORDER BY c.relname COLLATE "C",a.attnum
  `)).rows;
  const enums = (await db.query(`
    SELECT t.typname AS name,e.enumlabel AS label FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
    WHERE n.nspname='app' ORDER BY t.typname COLLATE "C",e.enumsortorder
  `)).rows;
  if (!columns.length) throw new Error('app schema has no tables');
  const q = JSON.stringify;
  const enumNames = new Set(enums.map(e=>e.name));
  function fieldType(c) {
    const primitive = {
      uuid:'string',text:'string',varchar:'string',bpchar:'string',timestamptz:'string',timestamp:'string',date:'string',
      int2:'number',int4:'number',int8:'string',numeric:'string',float4:'number',float8:'number',bool:'boolean',json:'DomainJson',jsonb:'DomainJson',
    };
    const type = c.type_schema==='app' && enumNames.has(c.type_name)
      ? `DomainDatabase["app"]["Enums"][${q(c.type_name)}]` : primitive[c.type_name];
    if (!type) throw new Error(`Unsupported catalog type ${c.type_schema}.${c.type_name}`);
    return type + (c.is_not_null ? '' : ' | null');
  }
  const tables = Map.groupBy(columns,c=>c.table_name);
  const output = [
    '// Generated from the applied app schema by tools/generate-domain-types.mjs. Do not edit.',
    '// Decimal numeric and bigint values cross the API boundary as strings to preserve precision.',
    'export type DomainJson = string | number | boolean | null | { [key: string]: DomainJson | undefined } | DomainJson[];',
    'export interface DomainDatabase {', '  app: {', '    Tables: {',
  ];
  for (const [table, fields] of tables) {
    output.push(`      ${q(table)}: {`);
    for (const mode of ['Row','Insert','Update']) {
      output.push(`        ${mode}: {`);
      for (const c of fields) {
        const generated = c.generated!=='';
        const optional = mode==='Update' || (mode==='Insert' && (generated || c.has_default || !c.is_not_null));
        const type = generated && mode!=='Row' ? 'never' : fieldType(c);
        output.push(`          ${q(c.column_name)}${optional?'?':''}: ${type};`);
      }
      output.push('        };');
    }
    output.push('      };');
  }
  output.push('    };','    Enums: {');
  for (const [name, labels] of Map.groupBy(enums,e=>e.name)) output.push(`      ${q(name)}: ${labels.map(e=>q(e.label)).join(' | ')};`);
  output.push('    };','  };','}','');
  return output.join('\n');
}
