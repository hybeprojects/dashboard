import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

function contentTypeForExt(ext: string) {
  const mapping: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf',
  };
  return mapping[ext.toLowerCase()] || 'application/octet-stream';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = req.query.path;

  if (Array.isArray(segments) && segments.length > 0) {
    const fullPath = path.join(process.cwd(), 'storage', ...segments.map((s) => String(s)));

    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) return res.status(404).json({ error: 'Not a file' });
      const file = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath);
      res.setHeader('Content-Type', contentTypeForExt(ext));
      res.setHeader('Content-Length', String(file.length));
      return res.send(file);
    }
  }

  return res.status(404).json({ error: 'File not found' });
}
