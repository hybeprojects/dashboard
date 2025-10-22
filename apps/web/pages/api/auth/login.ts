import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    // Use cookie serialize

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

  return res.status(200).json(data);
}
