import axios from 'axios';
import { recordMetric } from '../../../lib/metrics';
import { getDb, upsertAccountSnapshot } from '../../../lib/db';

// Protect this route with FINERACT_SYNC_SECRET env var
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const secret =
    req.headers['x-sync-secret'] || req.query.secret || process.env.FINERACT_SYNC_SECRET;
  if (!secret || String(secret) !== String(process.env.FINERACT_SYNC_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Kick off background sync without blocking response
  (async () => {
    try {
      const db = await getDb();
      const profiles = await db.all(
        'SELECT id, fineract_client_id FROM profiles WHERE fineract_client_id IS NOT NULL',
      );
      if (!profiles || !Array.isArray(profiles)) return;

      const fineractUrl = process.env.FINERACT_URL || '';
      const username = process.env.FINERACT_USER || process.env.FINERACT_USERNAME;
      const password = process.env.FINERACT_PASSWORD;
      const tenant = process.env.FINERACT_TENANT || process.env.FINERACT_TENANT_ID;

      const axiosConfig: any = { auth: { username, password }, headers: {}, timeout: 10000 };
      if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

      for (const p of profiles) {
        try {
          const clientId = p.fineract_client_id;
          if (!clientId) continue;
          const accountsUrl = `${fineractUrl.replace(/\/$/, '')}/clients/${clientId}/accounts`;
          const r = await axios.get(accountsUrl, axiosConfig);
          const accounts = Array.isArray(r.data) ? r.data : r.data?.pageItems || [];
          for (const a of accounts) {
            await upsertAccountSnapshot(p.id, a);
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
