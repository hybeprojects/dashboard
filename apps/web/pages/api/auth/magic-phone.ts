import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Magic phone authentication removed. Use standard credential flows instead.' });
}
