import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../_serverSupabase';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { accessToken } = req.body || {};
  if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Server Supabase not configured (SUPABASE_SERVICE_ROLE_KEY missing)' });

  try {
    const { data: userData, error } = await supabase.auth.getUser(accessToken);
    if (error || !userData?.user) return res.status(401).json({ error: 'Invalid supabase token' });
    const user = userData.user;
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET not configured' });
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    return res.status(200).json({ accessToken: token });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
