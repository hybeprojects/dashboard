import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ensureFineractClient } from '../../../lib/fineract';
import { getServiceRoleClient } from '../../../lib/supabase/api';
import { recordMetric } from '../../../lib/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { access_token } = req.body || {};
  if (!access_token) return res.status(400).json({ error: 'access_token required' });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON)
    return res.status(500).json({ error: 'Supabase not configured' });

  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${access_token}` } },
    auth: { persistSession: false },
  });

  try {
    const { data: userData, error: userErr } = await client.auth.getUser(access_token as any);
    if (userErr) return res.status(400).json({ error: userErr.message || 'Failed to get user' });
    const user = userData?.data?.user;
    if (!user) return res.status(400).json({ error: 'No user from token' });

    // Use service role client to update backend mapping
    const serviceSupabase = getServiceRoleClient();
    if (!serviceSupabase) return res.status(500).json({ error: 'Service client not configured' });

    const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || '';
    const lastName = user.user_metadata?.last_name || user.user_metadata?.lastName || '';

    try {
      const clientId = await ensureFineractClient(serviceSupabase, user.id, {
        firstName,
        lastName,
        email: user.email,
      });
      if (clientId) {
        await recordMetric('fineract.link.success', { userId: user.id, clientId });
      } else {
        await recordMetric('fineract.link.missing', { userId: user.id });
      }

      // Set server-side cookie so SSR can pick up session similar to login flow
      try {
        const cookie = require('cookie');
        const token = access_token;
        const cookieOpts: any = {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        };
        const cookieStr = cookie.serialize('sb-access-token', String(token), cookieOpts);
        res.setHeader('Set-Cookie', cookieStr);
      } catch (e) {
        // ignore cookie errors
      }

      return res.status(200).json({ ok: true, fineract_client_id: clientId });
    } catch (e: any) {
      await recordMetric('fineract.link.failure', {
        userId: user.id,
        error: e?.message || String(e),
      });
      return res.status(500).json({ error: e?.message || 'Linking failed' });
    }
  } catch (e: any) {
    console.error('OAuth callback error', e);
    await recordMetric('fineract.callback.error', { error: e?.message || String(e) });
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
