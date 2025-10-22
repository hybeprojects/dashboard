import { getServiceRoleClient } from './api';
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
  const supabase = getServiceRoleClient();
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
  const supabase = getServiceRoleClient();
  if (!supabase) {
    logger.error('getServerSupabase returned null for schema check');
    return { ok: false, error: 'Supabase service client not configured' } as const;
  }

  try {
    // Prefer catalog query, but fall back to probing known tables if access is not allowed.
    const catalog = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .limit(200);
    if (!catalog.error && Array.isArray(catalog.data)) {
      const tables = catalog.data.map((r: any) => r.tablename);
      logger.info('Schema query (pg_catalog) succeeded', { tablesCount: tables.length });
      return { ok: true, tables } as const;
    }

    logger.warn(
      'pg_catalog access unavailable, falling back to probing known tables',
      catalog.error && catalog.error.message,
    );

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
  const supabase = getServiceRoleClient();
  if (!supabase) return { exists: false } as const;

  try {
    // Try information_schema first for column metadata
    try {
      const cols = await supabase
        .from('information_schema.columns')
        .select('column_name,data_type,is_nullable,column_default,ordinal_position')
        .eq('table_schema', 'public')
        .eq('table_name', table)
        .order('ordinal_position', { ascending: true })
        .limit(200);

      if (!cols.error && Array.isArray(cols.data) && cols.data.length) {
        const columns = cols.data.map((c: any) => ({
          name: c.column_name,
          data_type: c.data_type,
          is_nullable: c.is_nullable,
          default: c.column_default,
          position: c.ordinal_position,
        }));

        // get count and recent rows
        let count: number | null = null;
        try {
          const head = await supabase.from(table).select('id', { count: 'exact' }).limit(1);
          if (!head.error)
            count =
              typeof (head.count as number) === 'number'
                ? head.count
                : Array.isArray(head.data)
                  ? head.data.length
                  : null;
        } catch (e) {
          // ignore
        }

        let recent: any[] = [];
        try {
          const recentRes = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
          if (!recentRes.error && Array.isArray(recentRes.data)) recent = recentRes.data;
          else {
            const recentRes2 = await supabase
              .from(table)
              .select('*')
              .order('id', { ascending: false })
              .limit(5);
            if (!recentRes2.error && Array.isArray(recentRes2.data)) recent = recentRes2.data;
          }
        } catch (e) {
          // ignore
        }

        return { exists: true, columns, count, recent } as const;
      }
    } catch (e) {
      // ignore information_schema errors and fallback
    }

    // Fallback: infer via select *
    const sample = await supabase
      .from(table)
      .select('*')
      .limit(1)
      .order('id', { ascending: false });
    if (sample.error) {
      const head = await supabase.from(table).select('id', { count: 'exact' }).limit(1);
      if (head.error) return { exists: false, error: head.error.message } as const;
      const count = typeof (head.count as number) === 'number' ? head.count : null;
      return { exists: true, columns: null, count } as const;
    }

    const row = Array.isArray(sample.data) && sample.data.length ? sample.data[0] : null;
    const columns = row ? Object.keys(row).map((n) => ({ name: n })) : null;

    let recent: any[] = [];
    try {
      const recentRes = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!recentRes.error && Array.isArray(recentRes.data)) recent = recentRes.data;
      else {
        const recentRes2 = await supabase
          .from(table)
          .select('*')
          .order('id', { ascending: false })
          .limit(5);
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
  const supabase = getServiceRoleClient();
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
      const count =
        typeof (res.count as number) === 'number'
          ? res.count
          : Array.isArray(res.data)
            ? res.data.length
            : null;
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

export async function fetchInformationSchema(tables: string[]) {
  const supabase = getServiceRoleClient();
  if (!supabase) return { ok: false, error: 'Supabase service client not configured' } as const;

  try {
    const q = await supabase
      .from('information_schema.columns')
      .select('table_name,column_name,data_type,is_nullable,column_default,ordinal_position')
      .eq('table_schema', 'public')
      .in('table_name', tables)
      .order('table_name', { ascending: true })
      .order('ordinal_position', { ascending: true })
      .limit(1000);

    if (!q.error && Array.isArray(q.data)) {
      return { ok: true, columns: q.data } as const;
    }

    logger.warn(
      'information_schema.columns query failed or returned no rows',
      q.error && q.error.message,
    );

    // Fallback: attempt to call a DB RPC that the project can add to expose column metadata
    try {
      // RPC function name expected: get_table_columns(table_names text[])
      const rpcRes = await supabase.rpc('get_table_columns', { table_names: tables });
      if (!rpcRes.error && Array.isArray(rpcRes.data)) {
        return { ok: true, columns: rpcRes.data } as const;
      }
      logger.warn('RPC get_table_columns failed', rpcRes.error && rpcRes.error.message);
      return {
        ok: false,
        error: q.error ? q.error.message : 'no information_schema rows and rpc failed',
      } as const;
    } catch (re: any) {
      logger.warn('RPC get_table_columns exception', re && (re.message || re));
      return { ok: false, error: q.error ? q.error.message : re?.message || String(re) } as const;
    }
  } catch (err: any) {
    logger.error('information_schema.columns exception', err?.message || err);
    return { ok: false, error: err?.message || String(err) } as const;
  }
}

export async function runDiagnostics() {
  logger.info('Running full Supabase diagnostics');
  const schema = await getSchemaInfo();
  const tablesToCheck =
    schema.ok && Array.isArray(schema.tables) && schema.tables.length > 0
      ? ['profiles', 'accounts', 'transactions'].filter((t) => schema.tables.includes(t))
      : ['profiles', 'accounts', 'transactions'];

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
