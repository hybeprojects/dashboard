import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const db = await getDb();
    const id = require('crypto').randomUUID();
    await db.run(
      'INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      userId,
      'fineract_sync_requested',
      'user',
      userId,
      JSON.stringify({ requested_at: new Date().toISOString() }),
    );
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
