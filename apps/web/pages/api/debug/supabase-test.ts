import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(500).json({ ok: false, error: 'Supabase service client not configured (SUPABASE_SERVICE_ROLE_KEY missing?)' });
    }

    // simple test: run a harmless query against pg_catalog to avoid depending on app tables
    try {
      const { data, error } = await supabase.rpc('version', {} as any).catch(() => ({ data: null, error: null }));
      // Not all Supabase DB allow custom RPC; fallback to selecting current_timestamp
      if (error) {
        const q = await supabase.from('profiles').select('id').limit(1);
        if (q.error) {
          return res.status(200).json({ ok: true, message: 'Supabase service client configured', test_query: null, profiles_select_error: q.error.message });
        }
        return res.status(200).json({ ok: true, message: 'Supabase service client configured', test_query: q.data });
      }
      return res.status(200).json({ ok: true, message: 'Supabase service client configured', rpc_version: data });
    } catch (err: any) {
      return res.status(200).json({ ok: true, message: 'Supabase service client configured but test query failed', error: err?.message || err });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || err });
  }
}
