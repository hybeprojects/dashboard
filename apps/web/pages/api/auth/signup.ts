import getServerSupabase from '../_serverSupabase';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
        // eslint-disable-next-line no-console
        console.warn('Failed to upsert profile', e);
      }

      // attempt to create a Fineract client (best-effort)
      try {
        const fineractUrl = process.env.FINERACT_URL || process.env.FINERACT_BASE_URL;
        const username = process.env.FINERACT_USERNAME;
        const passwordEnv = process.env.FINERACT_PASSWORD;
        const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;
        if (fineractUrl && username && passwordEnv) {
          const body = { firstname: firstName || '', lastname: lastName || '' };
          const axiosConfig: any = {
            auth: { username, password: passwordEnv },
            headers: {},
            timeout: 10000,
          };
          if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;
          const resp = await axios.post(
            `${fineractUrl.replace(/\/$/, '')}/clients`,
            body,
            axiosConfig,
          );
          const clientData = resp?.data || null;
          // try to extract client id from common fields
          const clientId = clientData?.clientId || clientData?.resourceId || clientData?.id || null;
          if (clientId) {
            await supabase
              .from('profiles')
              .update({ fineract_client_id: clientId })
              .eq('id', user.id);
          }
        }
      } catch (e) {
        // log but don't fail signup
        // eslint-disable-next-line no-console
        console.warn('Fineract client creation failed', e && (e as any).message ? (e as any).message : e);
      }
    }

    return res.status(200).json({ user: data, message: 'Signup initiated' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
