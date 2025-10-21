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

      console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    }
    return null;
  }
  if (typeof window === 'undefined') return null; // avoid creating client on server
  // enable session persistence in the browser so user stays signed in across refreshes
  client = createClient(url, anon, { auth: { persistSession: true } });
  return client;
}

export async function signInWithEmailOtp(email: string, redirectTo?: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not available');
  const redirect =
    redirectTo ??
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?email=${encodeURIComponent(email)}`
      : undefined);
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
}

export async function signInWithPhoneOtp(phone: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not available');
  return supabase.auth.signInWithOtp({ phone });
}

export async function signUpWithEmail(payload: {
  email: string;
  password: string;
  options?: Record<string, unknown>;
  redirectTo?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not available');
  const redirect =
    payload.redirectTo ??
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?email=${encodeURIComponent(payload.email)}`
      : undefined);
  return supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: { ...(payload.options || {}), emailRedirectTo: redirect },
  });
}

export async function signOutSupabase() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export default getSupabase;
