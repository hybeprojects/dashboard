import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../../api/_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const serverSupabase = getServerSupabase();
  if (!serverSupabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    const cookiesHeader = req.headers.cookie || '';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cookie = require('cookie');
    const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
    const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    // Validate token
    const { data: userData, error: userErr } = await serverSupabase.auth.getUser(token as string);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = userData.user.id;

    // Check admin flag
    const { data: profile, error: profileErr } = await serverSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    // Validate Fineract envs
    const { FINERACT_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT_ID } = process.env;
    if (!FINERACT_URL || !FINERACT_USERNAME || !FINERACT_PASSWORD || !FINERACT_TENANT_ID) {
      return res.status(500).json({ error: 'Fineract environment variables not configured' });
    }

    // Spawn reconcile script in background
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { spawn } = require('child_process');
    const child = spawn(process.execPath, ['server/scripts/reconcile_fineract.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();

    return res.status(202).json({ ok: true, message: 'Reconcile job started' });
  } catch (e: any) {
    console.error('reconcile-fineract error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
