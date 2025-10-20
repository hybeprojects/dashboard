import type { Database } from './types.gen';
import getServerSupabase from '../../pages/api/_serverSupabase';

export function validateServerEnv() {
  const missing: string[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return {
    ok: missing.length === 0,
    missing,
  } as const;
}

export async function safeTestSupabaseConnection() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { ok: false, error: 'Supabase service client not configured (missing service role key?)' } as const;
  }

  try {
    const q = await supabase.from('profiles').select('id').limit(1);
    if (q.error) {
      return { ok: false, error: q.error.message } as const;
    }
    return { ok: true, data: q.data } as const;
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) } as const;
  }
}
