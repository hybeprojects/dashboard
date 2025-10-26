import { getUserFromRequest } from '../../../../lib/serverAuth';
import { getDb } from '../../../../lib/db';
const crypto = require('crypto');

export default async function handler(req: any, res: any) {
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

    const { submissionId, decision, note } = req.body || {};
    if (!submissionId) return res.status(400).json({ error: 'Missing submissionId' });
    if (decision !== 'approved' && decision !== 'rejected') return res.status(400).json({ error: 'Invalid decision' });

    const status = decision === 'approved' ? 'approved' : 'rejected';

    await db.run(
      'UPDATE kyc_submissions SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = ? WHERE id = ?',
      status,
      user.id,
      note || null,
      new Date().toISOString(),
      submissionId,
    );

    // insert audit log if table exists (best-effort)
    try {
      await db.run(
        `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        user.id,
        'kyc_decision',
        'kyc_submission',
        submissionId,
        JSON.stringify({ decision, note }),
      );
    } catch (e) {
      // ignore audit log errors
    }

    const updated = await db.get('SELECT * FROM kyc_submissions WHERE id = ?', submissionId);
    return res.status(200).json({ success: true, submission: updated });
  } catch (e: any) {
    console.error('admin/kyc/decision error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
