import { getUserFromRequest } from '../../../lib/serverAuth';
import { getDb } from '../../../lib/db';

export default async function handler(req: any, res: any) {
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

    const users = await db.all('SELECT id, email, first_name, last_name, is_admin, created_at FROM profiles');
    return res.status(200).json({ users });
  } catch (err: any) {
    console.error('admin/users error', err?.message || err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
