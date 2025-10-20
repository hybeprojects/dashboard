import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../../api/_serverSupabase';
import { runDiagnostics } from '../../../lib/supabase/server-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const serverSupabase = getServerSupabase();
  if (!serverSupabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    // extract token from cookies to verify caller
    const cookiesHeader = req.headers.cookie || '';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cookie = require('cookie');
    const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
    const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    // validate token using service client
    const { data: userData, error: userErr } = await serverSupabase.auth.getUser(token as string);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = userData.user.id;

    // load profile using service client (this is server trusted check)
    const { data: profile, error: profileErr } = await serverSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const diagnostics = await runDiagnostics();
    return res.status(200).json({ ok: true, diagnostics });
  } catch (e: any) {
    console.error('supabase-diagnostics error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
