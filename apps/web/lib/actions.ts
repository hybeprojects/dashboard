import { createClient } from '@supabase/supabase-js';
import { getServiceRoleClient } from './supabase/api';
import { ensureFineractClient } from './fineract';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Missing credentials' };
  if (!SUPABASE_URL || !SUPABASE_ANON) return { error: 'Supabase not configured' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Ensure fineract mapping exists (best-effort) using service role client
  try {
    const service = getServiceRoleClient();
    if (service && data?.user) {
      const firstName =
        data.user.user_metadata?.first_name || data.user.user_metadata?.firstName || '';
      const lastName =
        data.user.user_metadata?.last_name || data.user.user_metadata?.lastName || '';
      ensureFineractClient(service, data.user.id, {
        firstName,
        lastName,
        email: data.user.email,
      }).catch((err: any) => console.error('Fineract sync best-effort failed', err));
    }
  } catch (e) {
    // ignore
  }

  return { data };
}

export async function getBankingData(token?: string) {
  // If token is provided, run server-side flow that attaches Authorization header
  if (token) {
    if (!SUPABASE_URL || !SUPABASE_ANON) throw new Error('Supabase not configured');

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) throw new Error('Invalid session');
    const user = userData.user;

    const service = getServiceRoleClient();
    if (!service) throw new Error('Supabase service client not configured');

    const { data: profile, error: profileErr } = await service
      .from('profiles')
      .select('fineract_client_id')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile?.fineract_client_id) throw new Error('No banking profile found');

    // Delegate to existing API route by calling internal fetch with bearer token
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const resp = await fetch(`${baseUrl}/api/banking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error('Failed to fetch banking data');
    return resp.json();
  }

  // Client-side flow: use sb-access-token cookie/session via API route
  const res = await fetch('/api/banking', {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Authentication required');
    throw new Error(`Failed to fetch banking data: ${res.status}`);
  }
  const json = await res.json();
  // normalize: if API returns { success: true, data } use data, otherwise return raw
  return json?.data ?? json;
}

export async function triggerFineractSync(userId: string) {
  try {
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) return { success: false, error: 'Service client not configured' };

    const { error } = await serviceClient.from('fineract_sync_queue').insert({
      user_id: userId,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Trigger sync error:', error);
    return { success: false, error };
  }
}
