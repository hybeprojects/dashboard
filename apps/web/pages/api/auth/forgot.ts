import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { email, redirectTo } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const supabase = getServiceRoleClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const redirect =
      redirectTo ||
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || ''}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(String(email), {
      redirectTo: redirect,
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, data });
  } catch (e: any) {
    console.error('auth/forgot error', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
