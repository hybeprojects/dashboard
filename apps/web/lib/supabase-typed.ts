import { createClient } from '@supabase/supabase-js';
import type { Database } from './db-types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createTypedSupabaseClient() {
  if (!url || !anon)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
  return createClient<Database>(url, anon, { auth: { persistSession: true } });
}

export default createTypedSupabaseClient;
