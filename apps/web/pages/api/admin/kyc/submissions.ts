import type { NextApiRequest, NextApiResponse } from 'next';
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

    const db = await getDb();
    const profile = await db.get('SELECT is_admin FROM profiles WHERE id = ?', user.id);
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const offset = (Math.max(1, page) - 1) * limit;

    const submissions = await db.all(
      'SELECT * FROM kyc_submissions ORDER BY created_at DESC LIMIT ? OFFSET ?',
      limit,
      offset,
    );
    const totalRow = await db.get('SELECT COUNT(1) as count FROM kyc_submissions');
    const total = totalRow ? totalRow.count : null;

    // attach signed urls for each submission
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

    return res.status(200).json({ submissions: out, page, limit, total });
  } catch (e: any) {
    console.error('admin/kyc/submissions error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
