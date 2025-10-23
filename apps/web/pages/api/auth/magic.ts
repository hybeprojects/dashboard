import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Magic link authentication removed. Use /api/auth/login (NextAuth credentials) instead.' });
}
