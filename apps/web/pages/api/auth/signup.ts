import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, createSessionToken } from '../../../lib/db';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await createUser({ email, password, firstName, lastName });
    const token = createSessionToken(user.id);

    const cookieStr = cookie.serialize('sb-access-token', String(token), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });
    res.setHeader('Set-Cookie', cookieStr);

    return res.status(200).json({ user: { id: user.id, email: user.email, user_metadata: { first_name: user.firstName, last_name: user.lastName } }, session: { access_token: token } });
  } catch (e: any) {
    console.error('signup error', e?.message || e);
    return res.status(400).json({ error: e?.message || 'Could not create user' });
  }
}
