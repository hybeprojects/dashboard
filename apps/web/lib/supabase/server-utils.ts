import { getDb } from '../../db';
import { logger } from '../logger';

export function validateServerEnv() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  const ok = missing.length === 0;
  const result = { ok, missing } as const;
  if (!ok) logger.warn('Server env validation failed', { missing });
  else logger.info('Server env validated');
  return result;
}

export async function safeTestSupabaseConnection() {
  logger.info('Starting database test query');
  try {
    const db = await getDb();
    const row = await db.get('SELECT id FROM profiles LIMIT 1');
    return { ok: true, data: row ? [row] : [] } as const;
  } catch (err: any) {
    logger.error('Database test query exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

export async function getSchemaInfo() {
  try {
    const db = await getDb();
    // sqlite_master lists tables
    const rows = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const tables = Array.isArray(rows) ? rows.map((r: any) => r.name) : [];
    logger.info('Schema discovery succeeded', { tablesCount: tables.length });
    return { ok: true, tables } as const;
  } catch (err: any) {
    logger.error('Schema query exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

async function getTableInfo(table: string) {
  try {
    const db = await getDb();
    const cols = await db.all(`PRAGMA table_info(${table})`);
    const columns = Array.isArray(cols) ? cols.map((c: any) => ({ name: c.name, type: c.type, notnull: !!c.notnull, default: c.dflt_value })) : null;

    let count: number | null = null;
    try {
      const cnt = await db.get(`SELECT COUNT(1) as count FROM ${table}`);
      count = cnt ? Number(cnt.count || 0) : 0;
    } catch (e) {
      // ignore
    }

    let recent: any[] = [];
    try {
      recent = await db.all(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 5`);
    } catch (e) {
      try {
        recent = await db.all(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 5`);
      } catch (e2) {
        recent = [];
      }
    }

    return { exists: true, columns, count, recent } as const;
  } catch (err: any) {
    return { exists: false, error: err?.message || String(err) } as const;
  }
}

export async function sampleCounts(tables: string[] = ['profiles', 'accounts', 'transactions']) {
  try {
    const db = await getDb();
    const results: Record<string, any> = {};
    for (const t of tables) {
      try {
        const r = await db.get(`SELECT COUNT(1) as count FROM ${t}`);
        const count = r ? Number(r.count || 0) : 0;
        const info = await getTableInfo(t);
        results[t] = { ok: true, count, info };
      } catch (e: any) {
        logger.warn('Count query exception for table', t, e?.message || e);
        results[t] = { ok: false, error: e?.message || String(e) };
      }
    }
    return { ok: true, results } as const;
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

export async function fetchInformationSchema(tables: string[]) {
  try {
    const db = await getDb();
    const cols: any[] = [];
    for (const t of tables) {
      try {
        const info = await db.all(`PRAGMA table_info(${t})`);
        if (Array.isArray(info)) {
          for (const c of info) {
            cols.push({ table_name: t, column_name: c.name, data_type: c.type, is_nullable: !c.notnull, column_default: c.dflt_value });
          }
        }
      } catch (e) {
        // ignore per-table errors
      }
    }
    return { ok: true, columns: cols } as const;
  } catch (err: any) {
    logger.error('fetchInformationSchema exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

export async function runDiagnostics() {
  logger.info('Running full DB diagnostics');
  const schema = await getSchemaInfo();
  const tablesToCheck = schema.ok && Array.isArray(schema.tables) && schema.tables.length > 0 ? ['profiles', 'accounts', 'transactions'].filter((t) => schema.tables.includes(t)) : ['profiles', 'accounts', 'transactions'];
  const counts = await sampleCounts(tablesToCheck);
  let information_schema: any = { ok: false, error: 'not attempted' };
  if (schema.ok && Array.isArray(schema.tables) && schema.tables.length > 0) {
    try {
      information_schema = await fetchInformationSchema(schema.tables);
    } catch (e: any) {
      logger.warn('Failed to fetch information_schema', e && (e.message || String(e)));
    }
  }
  return { ok: true, schema, counts, information_schema } as const;
}
