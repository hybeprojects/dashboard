import type { NextApiRequest, NextApiResponse } from 'next';
import { backupDatabase, getDatabaseFilePath } from '../../../lib/db';
import path from 'path';
import fs from 'fs';

function checkAdmin(req: NextApiRequest) {
  const adminKey = process.env.ADMIN_API_KEY || process.env.NEXTAUTH_SECRET;
  if (!adminKey) return false;
  const provided = req.headers['x-admin-key'] as string | undefined;
  return provided && provided === adminKey;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // list available backups
    const backupsDir = path.join(process.cwd(), 'storage', 'backups');
    if (!fs.existsSync(backupsDir)) return res.status(200).json({ ok: true, backups: [] });
    const list = fs.readdirSync(backupsDir).filter((f) => f.includes('.backup')).sort().reverse();
    return res.status(200).json({ ok: true, backups: list });
  }

  if (req.method === 'POST') {
    if (!checkAdmin(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
    try {
      const result = await backupDatabase();
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
