import getServerSupabase from '../_serverSupabase';
import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import getServerSupabase from '../_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Logged out' });
}
