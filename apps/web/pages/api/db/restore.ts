import type { NextApiRequest, NextApiResponse } from 'next';
import { restoreDatabaseFromBuffer } from '../../../lib/db';

function checkAdmin(req: NextApiRequest) {
  const adminKey = process.env.ADMIN_API_KEY || process.env.NEXTAUTH_SECRET;
  if (!adminKey) return false;
  const provided = req.headers['x-admin-key'] as string | undefined;
  return provided && provided === adminKey;
}

// Expect JSON body: { data: string (base64) }
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkAdmin(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const { data } = req.body || {};
  if (!data || typeof data !== 'string')
    return res.status(400).json({ ok: false, error: 'missing payload' });
  try {
    const buf = Buffer.from(data, 'base64');
    const result = await restoreDatabaseFromBuffer(buf);
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
