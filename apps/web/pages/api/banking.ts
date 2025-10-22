import type { NextApiRequest, NextApiResponse } from 'next';
import { createClientForRequest } from '../../lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = createClientForRequest(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    // Ensure user is authenticated
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Not authenticated' });

    const type = (req.query.type as string) || 'all';

    if (type === 'accounts' || type === 'all') {
      const { data: accounts, error: accErr } = await supabase.from('accounts').select('*');
      if (accErr) return res.status(500).json({ error: accErr.message });
      if (type === 'accounts') return res.status(200).json({ accounts });
    }

    if (type === 'transactions' || type === 'all') {
      const { data: transactions, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (txErr) return res.status(500).json({ error: txErr.message });
      if (type === 'transactions') return res.status(200).json({ transactions });
    }

    if (type === 'notifications') {
      const { data: notifications, error: nErr } = await supabase.from('notifications').select('*');
      if (nErr) return res.status(500).json({ error: nErr.message });
      return res.status(200).json({ notifications });
    }

    // default: return all
    const [{ data: accounts }, { data: transactions }, { data: notifications }] = await Promise.all([
      supabase.from('accounts').select('*'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*'),
    ]);

    return res.status(200).json({ accounts: accounts ?? [], transactions: transactions ?? [], notifications: notifications ?? [] });
  } catch (e: any) {
    console.error('banking api error', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
