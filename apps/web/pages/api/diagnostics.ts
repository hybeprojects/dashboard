import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../lib/serverAuth';
import { getDb } from '../lib/db';
import { storage } from '../lib/storage';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // basic admin check (profiles table may not exist yet in some setups)
    const db = await getDb();
    let isAdmin = false;
    try {
      const profile = await db.get('SELECT is_admin FROM profiles WHERE id = ?', user.id);
      isAdmin = !!(profile && profile.is_admin);
    } catch (e) {
      // if profiles table missing assume not admin
      isAdmin = false;
    }

    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const result: any = { ok: true, checks: {} };

    // DB check
    try {
      await db.get('SELECT 1 as ok');
      result.checks.db = { ok: true };
    } catch (e: any) {
      result.checks.db = { ok: false, error: e?.message || String(e) };
    }

    // Fineract check
    const fineractUrl = process.env.FINERACT_URL || process.env.FINERACT_BASE_URL || '';
    const fineractUser = process.env.FINERACT_USER || process.env.FINERACT_USERNAME || '';
    const fineractPass = process.env.FINERACT_PASSWORD || '';
    if (!fineractUrl) {
      result.checks.fineract = { configured: false, ok: null };
    } else {
      try {
        const axiosConfig: any = { timeout: 5000 };
        if (fineractUser && fineractPass) axiosConfig.auth = { username: fineractUser, password: fineractPass };
        const r = await axios.get(fineractUrl.replace(/\/$/, ''), axiosConfig);
        result.checks.fineract = { configured: true, ok: r.status >= 200 && r.status < 300, status: r.status };
      } catch (e: any) {
        result.checks.fineract = { configured: true, ok: false, error: e?.message || String(e) };
      }
    }

    // Storage check: ensure storage root exists and write/read a temp file via storage adapter
    try {
      const testName = `diag_${Date.now()}_${Math.random().toString(36).slice(2,6)}.txt`;
      const buf = Buffer.from('diagnostics');
      const upload = await storage.uploadFile(buf, testName, 'statements');
      // resolve to real path
      const storageRoot = path.join(process.cwd(), 'storage');
      const filePath = path.resolve(storageRoot, upload.path);
      const exists = fs.existsSync(filePath);
      let content = null;
      if (exists) {
        content = fs.readFileSync(filePath, 'utf8');
        // cleanup
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      result.checks.storage = { configured: true, ok: exists && content === 'diagnostics' };
    } catch (e: any) {
      result.checks.storage = { configured: true, ok: false, error: e?.message || String(e) };
    }

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('diagnostics endpoint error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
