import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../../lib/serverAuth';
import { getDb } from '../../../../lib/db';
import { storage } from '../../../../lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const submissionId = req.query.id as string;
    if (!submissionId) return res.status(400).json({ error: 'Missing id' });

    const db = await getDb();
    const sub = await db.get('SELECT * FROM kyc_submissions WHERE id = ?', submissionId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (String(sub.user_id) !== String(user.id))
      return res.status(403).json({ error: 'Forbidden' });

    const files = sub.files ? JSON.parse(sub.files) : [];
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

    return res.status(200).json({ urls });
  } catch (e: any) {
    console.error('kyc/signed error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
