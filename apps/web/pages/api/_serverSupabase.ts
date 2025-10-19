import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db-types';

let serverClient: SupabaseClient<Database> | null = null;

export function getServerSupabase(): SupabaseClient<Database> | null {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serverClient = createClient<Database>(url, key, { auth: { persistSession: false } });
  return serverClient;
}

export default getServerSupabase;
