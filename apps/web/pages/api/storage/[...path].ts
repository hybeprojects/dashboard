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
  if (!Array.isArray(segments) || segments.length === 0) {
    return res.status(404).json({ error: 'File not found' });
  }

  const storageRoot = path.join(process.cwd(), 'storage');
  const resolved = path.resolve(storageRoot, ...segments.map((s) => String(s)));
  const rootResolved = path.resolve(storageRoot);

  // Prevent path traversal
  if (!(resolved + path.sep).startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'File not found' });

  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) return res.status(404).json({ error: 'Not a file' });

  const file = fs.readFileSync(resolved);
  const ext = path.extname(resolved);
  res.setHeader('Content-Type', contentTypeForExt(ext));
  res.setHeader('Content-Length', String(file.length));
  res.setHeader('Cache-Control', 'private, max-age=60');
  return res.send(file);
}
