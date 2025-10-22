import axios from 'axios';
import { recordMetric } from './metrics';

export async function ensureFineractClient(
  supabase: any,
  userId: string,
  opts: { firstName?: string; lastName?: string; email?: string } = {},
) {
  if (!supabase) return null;

  try {
    // Check existing mapping in profiles
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('fineract_client_id')
      .eq('id', userId)
      .single();
    if (!profileErr && profileData && profileData.fineract_client_id)
      return profileData.fineract_client_id;
  } catch (e) {
    // ignore lookup errors and proceed to try create
  }

  const fineractUrl = process.env.FINERACT_URL || process.env.FINERACT_BASE_URL;
  const username = process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;

  if (!fineractUrl || !username || !password) {
    await recordMetric('fineract.config.missing', { userId });
    return null;
  }

  const body: any = { firstname: opts.firstName || '', lastname: opts.lastName || '' };

  const axiosConfig: any = {
    auth: { username, password },
    headers: {},
    timeout: 10000,
  };
  if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

  try {
    const resp = await axios.post(`${fineractUrl.replace(/\/$/, '')}/clients`, body, axiosConfig);
    const clientData = resp?.data || null;
    const clientId = clientData?.clientId || clientData?.resourceId || clientData?.id || null;
    if (clientId) {
      try {
        await supabase.from('profiles').update({ fineract_client_id: clientId }).eq('id', userId);
      } catch (e) {
        // ignore
      }
      try {
        const appUser = {
          id: userId,
          email: opts.email || null,
          fineract_client_id: clientId,
          account_id: null,
          first_name: opts.firstName || null,
          last_name: opts.lastName || null,
        };
        await supabase.from('app_users').upsert(appUser, { onConflict: 'id' });
      } catch (e) {
        // ignore
      }
    }

    await recordMetric('fineract.client.created', { userId, clientId: clientId || null });
    return clientId || null;
  } catch (e: any) {
    const message = e && e.message ? e.message : String(e);
    console.warn('Fineract client creation failed', message);
    await recordMetric('fineract.client.creation_failed', { userId, error: message });
    return null;
  }
}
