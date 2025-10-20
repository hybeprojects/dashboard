import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from './_serverSupabase';
import api from '../../lib/api';

const fallbackMemory: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseService = getServerSupabase();

  // Validate token server-side using helper
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getUserFromRequest } = require('../../lib/serverAuth');
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // Parse cookies for user session token (double-check multiple cookie names)
  const cookieHeader = (req.headers.cookie as string) || '';
  const cookie = require('cookie');
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const token =
    cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'] || null;

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  // Create a user-scoped Supabase client using the anon key but with Authorization header
  const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!anonUrl || !anonKey)
    return res.status(500).json({ error: 'Supabase anon key not configured' });

  // Import createClient lazily to avoid pulling into client bundles
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js');
  const userClient = createClient(anonUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  if (req.method === 'GET') {
    try {
      const { data, error } = await userClient
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data || []);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Unknown error' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body || !body.amount) return res.status(400).json({ error: 'Missing amount' });

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

    try {
      const accountId = sender || body.account_id;
      if (!accountId)
        return res.status(400).json({ error: 'sender_account_id (or account_id) is required' });

      // Fetch current balance under the user's credentials (RLS should enforce ownership)
      const { data: fromAcc, error: accErr } = await userClient
        .from('accounts')
        .select('id,balance')
        .eq('id', accountId)
        .maybeSingle();
      if (accErr) return res.status(500).json({ error: accErr.message });
      if (!fromAcc)
        return res.status(404).json({ error: 'Sender account not found or not authorized' });

      if (Number(fromAcc.balance) < amount)
        return res.status(400).json({ error: 'Insufficient funds' });

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

      // Insert under user client so RLS and policies apply
      const { data: inserted, error: insertError } = await userClient
        .from('transactions')
        .insert([insertPayload]);
      if (insertError) return res.status(500).json({ error: insertError.message });

      return res.status(200).json(inserted?.[0] ?? { success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Unknown error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
