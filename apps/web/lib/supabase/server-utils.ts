import getServerSupabase from '../../pages/api/_serverSupabase';
import { logger } from '../logger';

export function validateServerEnv() {
  const missing: string[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const result = {
    ok: missing.length === 0,
    missing,
  } as const;

  if (!result.ok) {
    logger.warn('Supabase environment validation failed', { missing: result.missing });
  } else {
    logger.info('Supabase environment validated');
  }

  return result;
}

export async function safeTestSupabaseConnection() {
  logger.info('Starting Supabase test query');
  const supabase = getServerSupabase();
  if (!supabase) {
    logger.error('getServerSupabase returned null');
    return {
      ok: false,
      error: 'Supabase service client not configured (missing service role key?)',
    } as const;
  }

  try {
    const q = await supabase.from('profiles').select('id').limit(1);
    if (q.error) {
      logger.warn('Supabase query returned error', q.error.message);
      return { ok: false, error: q.error.message } as const;
    }
    logger.info('Supabase query succeeded', { rows: Array.isArray(q.data) ? q.data.length : 0 });
    return { ok: true, data: q.data } as const;
  } catch (err: any) {
    logger.error('Supabase test query exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

export async function getSchemaInfo() {
  const supabase = getServerSupabase();
  if (!supabase) {
    logger.error('getServerSupabase returned null for schema check');
    return { ok: false, error: 'Supabase service client not configured' } as const;
  }

  try {
    // Prefer catalog query, but fall back to probing known tables if access is not allowed.
    const catalog = await supabase.from('pg_catalog.pg_tables').select('schemaname, tablename').eq('schemaname', 'public').limit(200);
    if (!catalog.error && Array.isArray(catalog.data)) {
      const tables = catalog.data.map((r: any) => r.tablename);
      logger.info('Schema query (pg_catalog) succeeded', { tablesCount: tables.length });
      return { ok: true, tables } as const;
    }

    logger.warn('pg_catalog access unavailable, falling back to probing known tables', catalog.error && catalog.error.message);

    // Fallback: probe a set of commonly used tables to see if they exist by attempting a lightweight select
    const candidates = ['profiles', 'accounts', 'transactions', 'app_users', 'kyc_submissions'];
    const found: string[] = [];
    for (const t of candidates) {
      try {
        const r = await supabase.from(t).select('id').limit(1);
        if (!r.error) {
          found.push(t);
        }
      } catch (e) {
        // ignore
      }
    }

    logger.info('Fallback schema probe completed', { found });
    return { ok: true, tables: found } as const;
  } catch (err: any) {
    logger.error('Schema query exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

async function getTableInfo(table: string) {
  const supabase = getServerSupabase();
  if (!supabase) return { exists: false } as const;

  // Check existence and try to infer columns and recent rows
  try {
    const sample = await supabase.from(table).select('*').limit(1).order('id', { ascending: false });
    if (sample.error) {
      // Table might be empty or not exist; try head query for count
      const head = await supabase.from(table).select('id', { count: 'exact' }).limit(1);
      if (head.error) return { exists: false, error: head.error.message } as const;
      const count = typeof (head.count as number) === 'number' ? head.count : null;
      return { exists: true, columns: null, count } as const;
    }

    const row = Array.isArray(sample.data) && sample.data.length ? sample.data[0] : null;
    const columns = row ? Object.keys(row) : null;

    // Fetch recent rows (prefer created_at, fallback to id desc)
    let recent: any[] = [];
    try {
      const recentRes = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(5);
      if (!recentRes.error && Array.isArray(recentRes.data)) recent = recentRes.data;
      else {
        const recentRes2 = await supabase.from(table).select('*').order('id', { ascending: false }).limit(5);
        if (!recentRes2.error && Array.isArray(recentRes2.data)) recent = recentRes2.data;
      }
    } catch (e) {
      // ignore
    }

    return { exists: true, columns, recent } as const;
  } catch (err: any) {
    return { exists: false, error: err?.message || String(err) } as const;
  }
}

export async function sampleCounts(tables: string[] = ['profiles', 'accounts', 'transactions']) {
  const supabase = getServerSupabase();
  if (!supabase) {
    logger.error('getServerSupabase returned null for sampleCounts');
    return { ok: false, error: 'Supabase service client not configured' } as const;
  }

  const results: Record<string, any> = {};

  for (const t of tables) {
    try {
      const res = await supabase.from(t).select('id', { count: 'exact' }).limit(1);
      if (res.error) {
        logger.warn('Count query failed for table', t, res.error.message);
        results[t] = { ok: false, error: res.error.message };
        continue;
      }
      const count = typeof (res.count as number) === 'number' ? res.count : Array.isArray(res.data) ? res.data.length : null;
      // also fetch columns and recent rows
      const info = await getTableInfo(t);
      results[t] = { ok: true, count, info };
    } catch (err: any) {
      logger.warn('Count query exception for table', t, err?.message || err);
      results[t] = { ok: false, error: err?.message || String(err) };
    }
  }

  return { ok: true, results } as const;
}

export async function runDiagnostics() {
  logger.info('Running full Supabase diagnostics');
  const schema = await getSchemaInfo();
  const tablesToCheck = (schema.ok && Array.isArray(schema.tables) && schema.tables.length > 0)
    ? ['profiles', 'accounts', 'transactions'].filter((t) => schema.tables.includes(t))
    : ['profiles', 'accounts', 'transactions'];

  const counts = await sampleCounts(tablesToCheck);

  return { ok: true, schema, counts } as const;
}
