import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NextApiRequest } from 'next';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServiceRoleClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export function parseTokenFromReq(req: NextApiRequest): string | null {
  // Prefer Authorization header
  const auth = req.headers?.authorization;
  if (auth && typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  // Fallback to cookies
  const cookieHeader = req.headers?.cookie || '';
  if (!cookieHeader) return null;
  // Use the same cookie names used across the app
  const cookie = require('cookie');
  const cookies = cookie.parse(cookieHeader || '');
  return (
    cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'] || null
  );
}

export function createClientForRequest(req: NextApiRequest): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;

  const token = parseTokenFromReq(req);

  if (!token) {
    // Return anon client when no user token is present
    return createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  }

  // Attach user's token to Authorization header so RLS and auth.getUser() work server-side
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}
