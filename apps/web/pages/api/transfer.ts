import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from './_serverSupabase';
import { getUserFromRequest } from '../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const serverSupabase = getServerSupabase();
  if (!serverSupabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const body = req.body || {};
  const from_account_id = body.from_account_id || body.fromAccountId || body.from;
  const to_account_id = body.to_account_id || body.toAccountId || body.to;
  const amountRaw = body.amount ?? body.amt ?? body.value;
  const currency = body.currency || 'USD';

  const amount = typeof amountRaw === 'string' ? parseFloat(amountRaw) : Number(amountRaw);

  if (!from_account_id || !to_account_id || !isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid input; require from_account_id, to_account_id and positive amount' });
  }

  try {
    const params = {
      p_from_account_id: from_account_id,
      p_to_account_id: to_account_id,
      p_amount: amount,
      p_currency: currency,
      p_actor: user.id,
    } as any;

    const rpc = await serverSupabase.rpc('process_transfer_with_limits', params);
    if (rpc.error) {
      // pass through known DB errors with 400
      return res.status(400).json({ error: rpc.error.message || rpc.error });
    }

    return res.status(200).json({ transferId: rpc.data });
  } catch (err: any) {
    console.error('transfer error', err && (err.message || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
