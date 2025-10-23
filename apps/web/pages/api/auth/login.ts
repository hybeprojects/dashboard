import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPassword, createSessionToken, getUserByEmail } from '../../../lib/db';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await verifyPassword(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = createSessionToken(user.id);

    const cookieOpts: any = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    };
    const cookieStr = cookie.serialize('sb-access-token', String(token), cookieOpts);
    res.setHeader('Set-Cookie', cookieStr);

    // Return a supabase-like shape for compatibility
    return res.status(200).json({ user: { id: user.id, email: user.email, user_metadata: { first_name: user.firstName, last_name: user.lastName } }, session: { access_token: token } });
  } catch (e: any) {
    console.error('login error', e?.message || e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
