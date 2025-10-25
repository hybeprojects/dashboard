import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/serverAuth';
import { getDb } from '../../../lib/db';
import { storage } from '../../../lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const db = await getDb();
    const submissions = await db.all('SELECT * FROM kyc_submissions WHERE user_id = ? ORDER BY created_at DESC', user.id);

    // attach signed urls for each file
    const out = [] as any[];
    for (const s of submissions || []) {
      const files = s.files ? JSON.parse(s.files) : [];
      const urls: Record<string, string | null> = {};
      for (const f of files) {
        const filename = f.filename || f.file || null;
        if (!filename) continue;
        try {
          urls[filename] = await storage.getSignedUrl(`kyc/${filename}`);
        } catch (e) {
          urls[filename] = null;
        }
      }
      out.push({ ...s, urls });
    }

    return res.status(200).json({ submissions: out });
  } catch (e: any) {
    console.error('kyc/submissions error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
