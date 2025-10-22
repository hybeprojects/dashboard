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
  const redirect =
    redirectTo ??
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?email=${encodeURIComponent(email)}`
      : undefined);
  const res = await fetch('/api/auth/magic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo: redirect }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Failed to send magic link');
  return body;
}

export async function signInWithPhoneOtp(phone: string) {
  const res = await fetch('/api/auth/magic-phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Failed to send phone OTP');
  return body;
}

export async function signUpWithEmail(payload: {
  email: string;
  password: string;
  options?: Record<string, unknown>;
  redirectTo?: string;
}) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Signup failed');
  return body;
}

export async function signOutSupabase() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // ignore
  }
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    // ignore
  }
}

export default getSupabase;
