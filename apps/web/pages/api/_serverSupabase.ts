import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

function getServerSupabase(): SupabaseClient | null {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serverClient = createClient(url, key, { auth: { persistSession: false } });
  return serverClient;
}

export default getServerSupabase;
