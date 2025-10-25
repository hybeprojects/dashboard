import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../../lib/storage';
import { getDb } from '../../../lib/db';
import * as yup from 'yup';
import {
  compose,
  withAuth,
  withCsrfVerify,
  withRateLimit,
  withValidation,
} from '../../../lib/api-middleware';

const schema = yup.object({
  fileData: yup.string().required(),
  fileName: yup.string().max(255).required(),
  userId: yup.string().uuid().required(),
});

function cryptoRandom() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch (e) {
    return String(Date.now()) + Math.random().toString(36).slice(2, 8);
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { fileData, fileName, userId } = req.body as {
      fileData: string;
      fileName: string;
      userId: string;
    };

    const fileBuffer = Buffer.from(fileData, 'base64');
    const safeName = `${userId}_${fileName}`.replace(/[^a-zA-Z0-9._-]/g, '_');

    const result = await storage.uploadFile(fileBuffer, safeName, 'kyc');

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
};

export default compose(
  handler,
  withValidation(schema, 'body'),
  withAuth(),
  withCsrfVerify(),
  withRateLimit({ windowMs: 60_000, limit: 10 }),
);
