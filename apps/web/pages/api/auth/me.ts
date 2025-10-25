import type { NextApiRequest, NextApiResponse } from 'next';
const cookie = require('cookie');
import { verifySessionToken, getUserById } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies['sb-access-token'] || null;
    if (!token) return res.status(401).json({ user: null });
    const payload = verifySessionToken(token);
    if (!payload || !payload.sub) return res.status(401).json({ user: null });
    const user = await getUserById(payload.sub);
    if (!user) return res.status(401).json({ user: null });
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { first_name: user.firstName, last_name: user.lastName },
      },
    });
  } catch (e: any) {
    console.error('auth/me error', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
