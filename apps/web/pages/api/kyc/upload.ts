import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../../lib/storage';
import { getDb } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { fileData, fileName, userId } = req.body;
    if (!fileData || !fileName || !userId)
      return res.status(400).json({ error: 'Missing parameters' });

    const fileBuffer = Buffer.from(fileData, 'base64');
    const safeName = `${userId}_${fileName}`.replace(/[^a-zA-Z0-9._-]/g, '_');

    const result = await storage.uploadFile(fileBuffer, safeName, 'kyc');

    // Store file path in SQLite
    const db = await getDb();
    const id = cryptoRandom();
    const files = JSON.stringify([{ filename: safeName, path: result.path, url: result.url }]);
    await db.run(
      'INSERT INTO kyc_submissions (id, user_id, files, status) VALUES (?, ?, ?, ?)',
      id,
      userId,
      files,
      'pending',
    );

    return res.json({ success: true, url: result.url, id });
  } catch (error: any) {
    console.error('KYC upload error', error?.message || error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}

function cryptoRandom() {
  // simple UUID fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch (e) {
    return String(Date.now()) + Math.random().toString(36).slice(2, 8);
  }
}
