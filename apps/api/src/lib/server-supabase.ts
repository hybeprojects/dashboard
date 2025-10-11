import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export default getServerSupabase;
