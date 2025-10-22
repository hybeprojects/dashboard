import type { NextApiRequest, NextApiResponse } from 'next';
import getServiceRoleClient from '../_serverSupabase';
import axios from 'axios';
import { recordMetric } from '../../../lib/metrics';

// Protect this route with FINERACT_SYNC_SECRET env var
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const secret =
    req.headers['x-sync-secret'] || req.query.secret || process.env.FINERACT_SYNC_SECRET;
  if (!secret || String(secret) !== String(process.env.FINERACT_SYNC_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const serviceSupabase = getServiceRoleClient();
  if (!serviceSupabase)
    return res.status(500).json({ error: 'Supabase service client not configured' });

  // Kick off background sync without blocking response
  (async () => {
    try {
      // Fetch all profiles with fineract_client_id
      const { data: profiles } = await serviceSupabase
        .from('profiles')
        .select('id, fineract_client_id')
        .not('fineract_client_id', 'is', null);
      if (!profiles || !Array.isArray(profiles)) return;

      const fineractUrl = process.env.FINERACT_URL || '';
      const username = process.env.FINERACT_USERNAME;
      const password = process.env.FINERACT_PASSWORD;
      const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;

      const axiosConfig: any = {
        auth: { username, password },
        headers: {},
        timeout: 10000,
      };
      if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

      for (const p of profiles) {
        try {
          const clientId = p.fineract_client_id;
          if (!clientId) continue;
          // Example Fineract accounts endpoint (may vary by deployment)
          const accountsUrl = `${fineractUrl.replace(/\/$/, '')}/clients/${clientId}/accounts`;
          const r = await axios.get(accountsUrl, axiosConfig);
          const accounts = r?.data || null;
          // store minimal snapshot in supabase accounts table if exists
          try {
            await serviceSupabase
              .from('accounts')
              .upsert({ user_id: p.id, data: accounts }, { onConflict: 'user_id' });
          } catch (e) {
            // ignore
          }
          await recordMetric('fineract.sync.success', {
            userId: p.id,
            clientId,
            count: Array.isArray(accounts) ? accounts.length : 1,
          });
        } catch (e: any) {
          await recordMetric('fineract.sync.failure', {
            userId: p.id,
            error: e?.message || String(e),
          });
        }
      }
    } catch (e: any) {
      console.error('Full fineract sync failed', e);
      await recordMetric('fineract.sync.failed_run', { error: e?.message || String(e) });
    }
  })();

  return res.status(202).json({ ok: true, message: 'Sync started' });
}
