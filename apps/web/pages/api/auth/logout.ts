import { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cookie = require('cookie');
    const cookieStr = cookie.serialize('sb-access-token', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
    });
    res.setHeader('Set-Cookie', cookieStr);
  } catch (e) {
    // ignore
  }

  return res.status(200).json({ message: 'Logged out' });
}
