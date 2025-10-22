import type { NextApiRequest, NextApiResponse } from 'next';
import { createClientForRequest } from '../../../lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClientForRequest(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return res.status(401).json({ user: null });
    const u = data.user;
    return res.status(200).json({ user: { id: u.id, email: u.email, user_metadata: u.user_metadata } });
  } catch (e: any) {
    console.error('auth/me error', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
