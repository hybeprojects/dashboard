import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../../_serverSupabase';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    const cookiesHeader = req.headers.cookie || '';
    const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
    const token =
      cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token as string);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = userData.user.id;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const offset = (Math.max(1, page) - 1) * limit;

    const {
      data: submissions,
      error: subsErr,
      count,
    } = await supabase
      .from('kyc_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (subsErr) return res.status(500).json({ error: subsErr.message });

    return res
      .status(200)
      .json({
        submissions: submissions || [],
        page,
        limit,
        total: typeof count === 'number' ? count : null,
      });
  } catch (e: any) {
    console.error('admin/kyc/submissions error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
