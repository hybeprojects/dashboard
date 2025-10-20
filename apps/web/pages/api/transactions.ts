import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from './_serverSupabase';
import api from '../../lib/api';

const fallbackMemory: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerSupabase();

  if (req.method === 'GET') {
    if (supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data || []);
    }
    // fallback: try backend API
    try {
      const r = await api.get('/transactions');
      if (r?.data) return res.status(200).json(r.data);
    } catch (e) {
      // ignore
    }
    return res.status(200).json(fallbackMemory);
  }

  if (req.method === 'POST') {
    const body = req.body;
    // Basic validation
    if (!body || !body.amount) return res.status(400).json({ error: 'Missing amount' });

    // Normalize possible field names to new schema
    const sender =
      body.sender_account_id ?? body.fromAccountId ?? body.from_account_id ?? body.account_id;
    const receiver =
      body.receiver_account_id ??
      body.toAccountId ??
      body.to_account_number ??
      body.toAccountNumber ??
      body.recipient_account;
    const amount = Number(body.amount ?? body.amt);
    const receiverEmail = body.receiver_email ?? body.recipient_email ?? null;
    const receiverName = body.receiver_name ?? body.recipient_name ?? null;

    if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // If server supabase available try to perform transfer RPC or insert a transaction
    if (supabase) {
      try {
        // Require a sender account id for a valid transaction row
        const accountId = sender || body.account_id;
        if (!accountId)
          return res.status(400).json({ error: 'sender_account_id (or account_id) is required' });

        // Fetch current balance to compute running_balance (required by schema)
        const { data: fromAcc, error: accErr } = await supabase
          .from('accounts')
          .select('id,balance')
          .eq('id', accountId)
          .maybeSingle();
        if (accErr) return res.status(500).json({ error: accErr.message });
        if (!fromAcc) return res.status(404).json({ error: 'Sender account not found' });

        const newBalance = Number(fromAcc.balance || 0) - amount;

        const insertPayload: any = {
          account_id: accountId,
          sender_account_id: accountId,
          receiver_account_id: receiver || null,
          receiver_email: receiverEmail,
          receiver_name: receiverName,
          amount: amount,
          type: 'transfer',
          status: 'completed',
          description: body.description || `Transfer from ${accountId} to ${receiver ?? ''}`.trim(),
          reference: body.reference || `TRF-${Date.now()}`,
          running_balance: newBalance,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('transactions')
          .insert([insertPayload]);
        if (insertError) return res.status(500).json({ error: insertError.message });

        return res.status(200).json(inserted?.[0] ?? { success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Unknown error' });
      }
    }

    // Fallback: try backend API
    try {
      const r = await api.post('/transactions', body);
      if (r?.data) return res.status(200).json(r.data);
    } catch (e) {
      // ignore
    }

    // Final fallback: store in memory (simulated)
    const tx = { id: `sim_${Date.now()}`, created_at: new Date().toISOString(), ...body };
    fallbackMemory.unshift(tx);
    return res.status(200).json(tx);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
