import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ ok: true, message: 'Supabase integration has been removed from this codebase.' });
}
