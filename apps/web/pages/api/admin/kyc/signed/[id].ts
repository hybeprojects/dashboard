import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import { verifySessionToken, getUserById, getDb } from '../../../../../lib/db';
import { storage } from '../../../../../lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const cookiesHeader = req.headers.cookie || '';
    const cookies = cookie.parse(cookiesHeader || '');
    const token = cookies['sb-access-token'] || null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifySessionToken(token);
    if (!payload || !payload.sub) return res.status(401).json({ error: 'Invalid token' });
    const userId = payload.sub as string;

    const db = await getDb();
    const profile = await db.get('SELECT is_admin FROM profiles WHERE id = ?', userId);
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const submissionId = req.query.id as string;
    if (!submissionId) return res.status(400).json({ error: 'Missing id' });

    const sub = await db.get('SELECT files FROM kyc_submissions WHERE id = ?', submissionId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

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
    console.error('admin/kyc/signed error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
