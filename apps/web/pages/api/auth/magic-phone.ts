import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  if (!URL || !ANON) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const supabase = createClient(URL, ANON, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (e: any) {
    console.error('auth/magic-phone error', e?.message || e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
