import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { getDb } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const db = await getDb();
    const profile = await db.get('SELECT is_admin FROM profiles WHERE id = ?', user.id);
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const { FINERACT_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT_ID } = process.env;
    if (!FINERACT_URL || !FINERACT_USERNAME || !FINERACT_PASSWORD || !FINERACT_TENANT_ID) {
      return res.status(500).json({ error: 'Fineract environment variables not configured' });
    }

    const { spawn } = require('child_process');
    const child = spawn(process.execPath, ['server/scripts/reconcile_fineract.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();

    return res.status(202).json({ ok: true, message: 'Reconcile job started' });
  } catch (e: any) {
    console.error('reconcile-fineract error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
