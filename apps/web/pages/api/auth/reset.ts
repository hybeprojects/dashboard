import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { accessToken, password } = req.body;
  if (!accessToken || !password) return res.status(400).json({ error: 'accessToken and password required' });
  if (!URL || !ANON) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const supabase = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true, data });
  } catch (e: any) {
    console.error('auth/reset error', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
