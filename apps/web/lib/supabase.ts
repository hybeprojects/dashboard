import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Returns a lazily-initialized Supabase client for browser usage.
 * On the server this will return null to avoid creating a client during SSR.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anon) {
    if (typeof window !== 'undefined') {
      // Only warn in the browser; server logs may be sensitive.
      // eslint-disable-next-line no-console
      console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    }
    return null;
  }
  if (typeof window === 'undefined') return null; // avoid creating client on server
  client = createClient(url, anon, { auth: { persistSession: false } });
  return client;
}

export default getSupabase;
