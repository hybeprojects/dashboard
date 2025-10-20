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
