import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../lib/serverAuth';
import { getDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    const { type } = req.query;

    const userAccounts = await db.all('SELECT * FROM accounts WHERE user_id = ?', user.id);

    if (type === 'accounts') {
      return res.status(200).json({ accounts: userAccounts });
    }

    const accountIds = userAccounts.map((a: any) => a.id);

    if (accountIds.length === 0) {
      if (type === 'transactions') {
        return res.status(200).json({ transactions: [] });
      }
      return res.status(200).json({ accounts: [], transactions: [] });
    }

    const placeholders = accountIds.map(() => '?').join(',');
    const transactions = await db.all(
      `SELECT * FROM transactions WHERE from_account_id IN (${placeholders}) OR to_account_id IN (${placeholders}) ORDER BY created_at DESC`,
      [...accountIds, ...accountIds]
    );

    if (type === 'transactions') {
      return res.status(200).json({ transactions });
    }

    // Default case for SSR
    return res.status(200).json({ accounts: userAccounts, transactions });

  } catch (e) {
    console.error('Banking API fatal error', e && (e as any).message ? (e as any).message : e);
    return res.status(500).json({ error: 'Failed to fetch banking data' });
  }
}
