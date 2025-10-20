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
    return { ok: false, error: 'Supabase service client not configured (missing service role key?)' } as const;
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
    // Query Postgres catalog for public tables. Service role key required for low-level access.
    const q = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .order('tablename', { ascending: true })
      .limit(100);

    if (q.error) {
      logger.warn('Schema query error', q.error.message);
      return { ok: false, error: q.error.message } as const;
    }

    const tables = Array.isArray(q.data) ? q.data.map((r: any) => r.tablename) : [];
    logger.info('Schema query succeeded', { tablesCount: tables.length });

    return { ok: true, tables } as const;
  } catch (err: any) {
    logger.error('Schema query exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
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
      results[t] = { ok: true, count };
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
