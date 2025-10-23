import axios from 'axios';
import { getDb } from './db';
import { recordMetric } from './metrics';

export async function ensureFineractClient(userId: string, opts: { firstName?: string; lastName?: string; email?: string } = {}) {
  const db = await getDb();

  try {
    const row = await db.get('SELECT fineract_client_id FROM profiles WHERE id = ?', userId);
    if (row && row.fineract_client_id) return row.fineract_client_id;
  } catch (e) {
    // ignore and attempt to create
  }

  const fineractUrl = process.env.FINERACT_URL || process.env.FINERACT_BASE_URL;
  const username = process.env.FINERACT_USER || process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const tenant = process.env.FINERACT_TENANT || process.env.FINERACT_TENANT_ID;

  if (!fineractUrl || !username || !password) {
    await recordMetric('fineract.config.missing', { userId });
    return null;
  }

  const body: any = { firstname: opts.firstName || '', lastname: opts.lastName || '' };
  const axiosConfig: any = { auth: { username, password }, headers: {}, timeout: 10000 };
  if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

  try {
    const resp = await axios.post(`${fineractUrl.replace(/\/$/, '')}/clients`, body, axiosConfig);
    const clientData = resp?.data || null;
    const clientId = clientData?.clientId || clientData?.resourceId || clientData?.id || null;
    if (clientId) {
      try {
        await db.run('UPDATE profiles SET fineract_client_id = ? WHERE id = ?', clientId, userId);
      } catch (e) {
        // ignore
      }
      try {
        await db.run(
          `INSERT INTO app_users (id, email, fineract_client_id, account_id, first_name, last_name)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET email=excluded.email, fineract_client_id=excluded.fineract_client_id`,
          userId,
          opts.email || null,
          clientId,
          null,
          opts.firstName || null,
          opts.lastName || null,
        );
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

export async function createFineractTransfer(payload: any) {
  const fineractUrl = process.env.FINERACT_URL || process.env.FINERACT_BASE_URL;
  const username = process.env.FINERACT_USER || process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const tenant = process.env.FINERACT_TENANT || process.env.FINERACT_TENANT_ID;
  if (!fineractUrl || !username || !password) return null;

  const axiosConfig: any = { auth: { username, password }, headers: {}, timeout: 10000 };
  if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

  try {
    const resp = await axios.post(`${fineractUrl.replace(/\/$/, '')}/transfers`, payload, axiosConfig);
    return resp.data;
  } catch (e) {
    console.warn('Fineract transfer failed', e && (e as any).message ? (e as any).message : e);
    return null;
  }
}
