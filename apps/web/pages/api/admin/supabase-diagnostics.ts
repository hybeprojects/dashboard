import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { getDb } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const db = await getDb();
    const profile = await db.get('SELECT is_admin FROM profiles WHERE id = ?', user.id);
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    // Basic diagnostics: counts of key tables and env checks
    const counts: Record<string, any> = {};
    const tables = ['profiles', 'accounts', 'transactions', 'kyc_submissions', 'audit_logs'];
    for (const t of tables) {
      try {
        const r = await db.get(`SELECT COUNT(1) as count FROM ${t}`);
        counts[t] = r ? r.count : 0;
      } catch (e) {
        counts[t] = { error: 'table_missing_or_unreadable' };
      }
    }

    const env = {
      FINERACT_URL: !!process.env.FINERACT_URL,
      FINERACT_USER: !!(process.env.FINERACT_USER || process.env.FINERACT_USERNAME),
      FINERACT_PASSWORD: !!process.env.FINERACT_PASSWORD,
      MEDUSA_URL: !!process.env.MEDUSA_URL,
    };

    return res.status(200).json({ ok: true, counts, env });
  } catch (e: any) {
    console.error('diagnostics error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
