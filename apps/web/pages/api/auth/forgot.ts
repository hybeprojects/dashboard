import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Password reset via Supabase removed. Use account settings or contact admin.' });
}
