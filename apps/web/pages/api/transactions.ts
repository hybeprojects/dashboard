import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../lib/serverAuth';
import { getUserAccounts, createTransaction, getAccountById, updateAccountBalance } from '../../lib/db';
import { createFineractTransfer } from '../../lib/fineract';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'GET') {
      // Return transactions for user's accounts
      const accounts = await getUserAccounts(user.id);
      const accountIds = accounts.map((a: any) => a.id);
      if (accountIds.length === 0) return res.status(200).json([]);
      const db = await (await import('../../lib/db')).getDb();
      const rows = await db.all(
        `SELECT * FROM transactions WHERE from_account_id IN (${accountIds.map(() => '?').join(',')}) OR to_account_id IN (${accountIds.map(() => '?').join(',')}) ORDER BY created_at DESC LIMIT 200`,
        ...accountIds,
        ...accountIds,
      );
      return res.status(200).json(rows || []);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || !body.amount) return res.status(400).json({ error: 'Missing amount' });

      const sender = body.sender_account_id ?? body.fromAccountId ?? body.from_account_id ?? body.account_id;
      const receiver = body.receiver_account_id ?? body.toAccountId ?? body.to_account_number ?? body.toAccountNumber ?? body.recipient_account;
      const amount = Number(body.amount ?? body.amt);
      if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

      if (!sender) return res.status(400).json({ error: 'sender_account_id (or account_id) is required' });

      // Verify ownership
      const fromAcc = await getAccountById(sender);
      if (!fromAcc) return res.status(404).json({ error: 'Sender account not found' });
      if (fromAcc.user_id !== user.id) return res.status(403).json({ error: 'Not authorized to operate on this account' });

      if (Number(fromAcc.balance) < amount) return res.status(400).json({ error: 'Insufficient funds' });

      // perform transfer locally
      const toAcc = receiver ? await getAccountById(receiver) : null;
      const newFromBalance = Number(fromAcc.balance) - amount;
      await updateAccountBalance(fromAcc.id, newFromBalance);
      if (toAcc) {
        const newToBalance = Number(toAcc.balance) + amount;
        await updateAccountBalance(toAcc.id, newToBalance);
      }

      const txPayload: any = {
        from_account_id: fromAcc.id,
        to_account_id: toAcc ? toAcc.id : null,
        amount: amount,
        currency: body.currency || 'USD',
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      const txId = await createTransaction(txPayload);

      // Best-effort Fineract sync
      try {
        await createFineractTransfer({ fromAccountId: fromAcc.id, toAccountId: toAcc?.id || null, amount, currency: txPayload.currency, reference: `TRF-${txId}` });
      } catch (e) {
        console.warn('Fineract sync failed for transaction', e && (e as any).message ? (e as any).message : e);
      }

      const db = await (await import('../../lib/db')).getDb();
      const row = await db.get('SELECT * FROM transactions WHERE id = ?', txId);
      return res.status(200).json(row || { id: txId });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e: any) {
    console.error('transactions API error', e?.message || e);
    res.status(500).json({ error: 'Internal error' });
  }
}
