import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { getUserAccounts, upsertAccountSnapshot } from '../../../lib/db';
import { ensureFineractClient } from '../../../lib/fineract';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'GET') {
      // return accounts from local snapshot
      const accounts = await getUserAccounts(user.id);
      return res.status(200).json({ accounts });
    }

    if (req.method === 'POST') {
      // Trigger a sync from Fineract and persist snapshot
      const fineractUrl = process.env.FINERACT_URL || '';
      if (!fineractUrl) return res.status(500).json({ error: 'Fineract not configured' });

      // ensure fineract client mapping exists
      const clientId = await ensureFineractClient(user.id, { firstName: user.firstName, lastName: user.lastName, email: user.email });
      if (!clientId) return res.status(500).json({ error: 'Failed to map to Fineract client' });

      try {
        const username = process.env.FINERACT_USER || process.env.FINERACT_USERNAME;
        const password = process.env.FINERACT_PASSWORD;
        const tenant = process.env.FINERACT_TENANT || process.env.FINERACT_TENANT_ID;
        const axiosConfig: any = { auth: { username, password }, headers: {}, timeout: 10000 };
        if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

        const r = await axios.get(`${fineractUrl.replace(/\/$/, '')}/clients/${clientId}/accounts`, axiosConfig);
        const accounts = Array.isArray(r.data) ? r.data : r.data?.pageItems || [];

        // persist snapshot to local DB
        for (const a of accounts) {
          await upsertAccountSnapshot(user.id, a);
        }

        return res.status(200).json({ accounts });
      } catch (e: any) {
        console.warn('Fineract accounts fetch failed', e?.message || e);
        return res.status(500).json({ error: 'Failed to fetch accounts from Fineract' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e: any) {
    console.error('accounts API error', e?.message || e);
    res.status(500).json({ error: 'Internal error' });
  }
}
