import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import getServerSupabase from '../_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  const { email, password, firstName, lastName, userType } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // build email redirect URL for confirmation
  const redirectTo =
    (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || '') +
    `/verify-email?email=${encodeURIComponent(email)}`;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
        },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    const user = data?.user || null;

    // create or upsert profile row in Supabase
    if (user) {
      const profile = {
        id: user.id,
        email: user.email,
        first_name: firstName || user.user_metadata?.first_name || null,
        last_name: lastName || user.user_metadata?.last_name || null,
        user_type: userType || user.user_metadata?.user_type || null,
      };
      try {
        await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
      } catch (e) {
        // ignore profile insert errors but log to server console

        console.warn('Failed to upsert profile', e);
      }

      // attempt to create or link a Fineract client (best-effort)
      try {
        const { ensureFineractClient } = require('../../../lib/fineract');
        // don't block signup if linking fails
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ensureFineractClient(supabase, user.id, {
          firstName: firstName || user.user_metadata?.first_name || '',
          lastName: lastName || user.user_metadata?.last_name || '',
          email: user.email,
        });
      } catch (e) {
        console.warn('Fineract linking failed during signup', e && (e as any).message ? (e as any).message : e);
      }
    }

    return res.status(200).json({ user: data, message: 'Signup initiated' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
