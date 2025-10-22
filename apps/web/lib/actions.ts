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
      const firstName = data.user.user_metadata?.first_name || data.user.user_metadata?.firstName || '';
      const lastName = data.user.user_metadata?.last_name || data.user.user_metadata?.lastName || '';
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ensureFineractClient(service, data.user.id, { firstName, lastName, email: data.user.email });
    }
  } catch (e) {
    // ignore
  }

  return { data };
}

export async function getBankingData(token?: string) {
  if (!token) throw new Error('Missing auth token');
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
