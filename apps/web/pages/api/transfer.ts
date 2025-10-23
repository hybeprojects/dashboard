import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../lib/serverAuth';
import {
  getAccountById,
  createTransaction,
  updateAccountBalance,
  getDb,
} from '../../lib/db';
import { createFineractTransfer } from '../../lib/fineract';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const user = await getUserFromRequest(req as any);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const body = req.body || {};
  const from_account_id = body.from_account_id || body.fromAccountId || body.from;
  const to_account_id = body.to_account_id || body.toAccountId || body.to;
  const amountRaw = body.amount ?? body.amt ?? body.value;
  const currency = body.currency || 'USD';
  const amount = typeof amountRaw === 'string' ? parseFloat(amountRaw) : Number(amountRaw);

  if (!from_account_id || !to_account_id || !isFinite(amount) || amount <= 0) {
    return res
      .status(400)
      .json({ error: 'Invalid input; require from_account_id, to_account_id and positive amount' });
  }

  try {
    const fromAcc = await getAccountById(from_account_id);
    const toAcc = await getAccountById(to_account_id);
    if (!fromAcc) return res.status(404).json({ error: 'from_account not found' });
    if (!toAcc) return res.status(404).json({ error: 'to_account not found' });

    // Ensure caller owns the from account
    if (String(fromAcc.user_id) !== String(user.id)) return res.status(403).json({ error: 'Forbidden' });

    const fromBalance = Number(fromAcc.balance || 0);
    if (fromBalance < amount) return res.status(400).json({ error: 'Insufficient funds' });

    // Simple local ledger update
    const newFrom = fromBalance - amount;
    const newTo = Number(toAcc.balance || 0) + amount;

    await updateAccountBalance(from_account_id, newFrom);
    await updateAccountBalance(to_account_id, newTo);

    const txId = await createTransaction({
      from_account_id,
      to_account_id,
      amount,
      currency,
      status: 'done',
    });

    // Best-effort: create Fineract transfer if configured
    try {
      const fineractResp = await createFineractTransfer({ from_account_id, to_account_id, amount, currency });
      // Optionally record fineract response in audit log
      if (!fineractResp) {
        const db = await getDb();
        const id = require('crypto').randomUUID();
        await db.run(
          'INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
          id,
          user.id,
          'fineract.transfer_failed',
          'transaction',
          txId,
          JSON.stringify({ reason: 'fineract_sync_failed', timestamp: new Date().toISOString() }),
        );
      }
    } catch (e) {
      // ignore fineract errors
    }

    return res.status(200).json({ transferId: txId });
  } catch (err: any) {
    console.error('transfer error', err && (err.message || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
