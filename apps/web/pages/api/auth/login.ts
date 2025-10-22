import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  if (!URL || !ANON) return res.status(500).json({ error: 'Supabase not configured' });

  const supabase = createClient(URL, ANON, { auth: { persistSession: false } });

  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Attempt to set a server-side cookie so SSR pages can validate sessions.
  try {
    const token = data?.session?.access_token || '';
    const expiresAt = data?.session?.expires_at || null;
    const maxAge =
      typeof expiresAt === 'number'
        ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
        : undefined;

    const cookie = require('cookie');
    const cookieOpts: any = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };
    if (typeof maxAge === 'number') cookieOpts.maxAge = maxAge;
    const cookieStr = cookie.serialize('sb-access-token', String(token), cookieOpts);
    res.setHeader('Set-Cookie', cookieStr);
  } catch (e) {
    // ignore cookie set errors
  }

  // best-effort: attempt to ensure Fineract client mapping exists for this user
  try {
    const getServerSupabase = require('../_serverSupabase').default;
    const { ensureFineractClient } = require('../../../lib/fineract');
    const serviceSupabase = getServerSupabase();
    if (serviceSupabase && data?.user) {
      const firstName = data.user.user_metadata?.first_name || data.user.user_metadata?.firstName || '';
      const lastName = data.user.user_metadata?.last_name || data.user.user_metadata?.lastName || '';
      // don't block login response on linking
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ensureFineractClient(serviceSupabase, data.user.id, { firstName, lastName, email: data.user.email });
    }
  } catch (e) {
    // ignore fineract linking errors
    console.warn('Fineract linking failed in login handler', e && (e as any).message ? (e as any).message : e);
  }

  return res.status(200).json(data);
}
