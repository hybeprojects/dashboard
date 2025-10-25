import type { NextApiRequest, NextApiResponse } from 'next';
import { runVacuum, runIntegrityCheck } from '../../../lib/db';

function checkAdmin(req: NextApiRequest) {
  const adminKey = process.env.ADMIN_API_KEY || process.env.NEXTAUTH_SECRET;
  if (!adminKey) return false;
  const provided = req.headers['x-admin-key'] as string | undefined;
  return provided && provided === adminKey;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkAdmin(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const { action } = req.body || {};
  if (!action) return res.status(400).json({ ok: false, error: 'missing action' });
  try {
    if (action === 'vacuum') {
      const r = await runVacuum();
      return res.status(200).json(r);
    }
    if (action === 'integrity') {
      const r = await runIntegrityCheck();
      return res.status(200).json(r);
    }
    return res.status(400).json({ ok: false, error: 'unknown action' });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
