import type { NextApiRequest, NextApiResponse } from 'next';
import getServiceRoleClient from '../../_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const { error } = await supabase
      .from('fineract_sync_queue')
      .insert([{ user_id: userId, status: 'pending', created_at: new Date().toISOString() }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
