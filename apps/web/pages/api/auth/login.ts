import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Use Supabase client for login (signInWithPassword) and call /auth/setup-profile on the server.' });
}
