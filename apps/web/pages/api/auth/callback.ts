import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'OAuth callback based on Supabase token removed. Use application OAuth flows configured in NextAuth.' });
}
