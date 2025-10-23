import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getUserFromRequest } from '../../lib/serverAuth';
import { getDb, upsertAccountSnapshot } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    // Attempt to resolve fineract_client_id from profiles then app_users
    let p = await db.get('SELECT fineract_client_id, is_admin FROM profiles WHERE id = ?', user.id);
    if (!p) {
      p = await db.get('SELECT fineract_client_id FROM app_users WHERE id = ?', user.id);
    }
    const clientId = p?.fineract_client_id;
    if (!clientId) return res.status(404).json({ error: 'No banking profile found' });

    const fineractUrl = (process.env.FINERACT_URL || '').replace(/\/$/, '');
    const username = process.env.FINERACT_USERNAME || process.env.FINERACT_USER;
    const password = process.env.FINERACT_PASSWORD;
    const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;

    if (!fineractUrl || !username || !password) {
      return res.status(500).json({ error: 'Fineract not configured' });
    }

    const axiosConfig: any = { auth: { username, password }, headers: {}, timeout: 10000 };
    if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

    let accounts: any = [];
    try {
      const r = await axios.get(`${fineractUrl}/clients/${clientId}/accounts`, axiosConfig);
      accounts = r?.data || [];

      // persist snapshots locally
      if (Array.isArray(accounts)) {
        for (const a of accounts) {
          try {
            await upsertAccountSnapshot(user.id, a);
          } catch (e) {
            // ignore per-account persistence errors
            console.warn('Failed to persist account snapshot', e && (e as any).message ? (e as any).message : e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch accounts from Fineract', e && (e as any).message ? (e as any).message : e);
      // fallback: return local snapshots
      const rows = await db.all('SELECT * FROM accounts WHERE user_id = ?', user.id);
      accounts = rows || [];
    }

    const balances: Record<string, number> = {};
    if (Array.isArray(accounts)) {
      accounts.forEach((a: any) => {
        const id = a?.id || a?.accountId || a?.resourceId || String(a?.account_number || '') || '__unknown__';
        const bal = a?.balance ?? a?.currentBalance ?? a?.availableBalance ?? a?.amount ?? 0;
        const num = typeof bal === 'string' ? Number(bal) : typeof bal === 'number' ? bal : 0;
        balances[id] = isNaN(num) ? 0 : num;
      });
    }

    // Best-effort transactions
    let transactions: any[] = [];
    try {
      const txUrl1 = `${fineractUrl}/clients/${clientId}/transactions`;
      const txRes = await axios.get(txUrl1, axiosConfig);
      transactions = Array.isArray(txRes?.data) ? txRes.data : txRes?.data?.pageItems || [];
    } catch (e) {
      transactions = [];
    }

    return res.status(200).json({ accounts, balances, transactions });
  } catch (e) {
    console.error('Banking API fatal error', e && (e as any).message ? (e as any).message : e);
    return res.status(500).json({ error: 'Failed to fetch banking data' });
  }
}
