import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../../api/_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    const cookieHeader = (req.headers.cookie as string) || '';
    const cookie = require('cookie');
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
    const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    // Validate token and get user
    const { data: userData, error: userErr } = await supabase.auth.getUser(token as string);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    const userId = userData.user.id;

    // Check admin flag in profiles
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    // Fetch users
    const { data: users, error: usersErr } = await supabase.from('profiles').select('id, email, first_name, last_name, is_admin, created_at');
    if (usersErr) return res.status(500).json({ error: 'Failed to fetch users' });

    return res.status(200).json({ users });
  } catch (err: any) {
    console.error('admin/users error', err?.message || err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
