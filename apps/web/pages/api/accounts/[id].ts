import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { getAccountById } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'Missing account id' });

    const acc = await getAccountById(id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    if (acc.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    return res.status(200).json(acc);
  } catch (e: any) {
    console.error('account detail error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
