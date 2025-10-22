import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks as any);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const fallbackLocal = 'http://localhost:5000';
  const targets: string[] = [];
  if (apiBase) targets.push(`${apiBase.replace(/\/$/, '')}/kyc/submit`);
  // local dev fallback
  targets.push(`${fallbackLocal.replace(/\/$/, '')}/kyc/submit`);

  const headers: Record<string, string> = {};
  // Forward incoming content-type and cookies
  if (req.headers['content-type']) headers['content-type'] = String(req.headers['content-type']);
  if (req.headers.cookie) headers['cookie'] = String(req.headers.cookie);
  if (req.headers.accept) headers['accept'] = String(req.headers.accept);

  let lastError: any = null;
  let response: Response | null = null;

  const bodyBuffer = await readRawBody(req);

  for (const t of targets) {
    try {
      const r = await fetch(t, { method: 'POST', headers, body: bodyBuffer });
      if (r.ok) {
        response = r;
        break;
      }
      try {
        const txt = await r.text();
        lastError = { status: r.status, statusText: r.statusText, body: txt };
      } catch (e) {
        lastError = { status: r.status, statusText: r.statusText };
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!response) {
    console.error('KYC submit proxy: all targets failed', lastError);
    return res.status(502).json({ error: 'Bad gateway', details: lastError });
  }

  // Forward status
  res.status(response.status);

  // Forward content-type
  const contentType = response.headers.get('content-type');
  if (contentType) res.setHeader('content-type', contentType);

  // Forward set-cookie if present
  try {
    // Node fetch's Headers may expose raw via (response as any).headers.raw
    const anyHeaders: any = (response as any).headers;
    if (anyHeaders && typeof anyHeaders.raw === 'function') {
      const raw = anyHeaders.raw();
      if (raw && Array.isArray(raw['set-cookie'])) res.setHeader('set-cookie', raw['set-cookie']);
    } else {
      const single = response.headers.get('set-cookie');
      if (single) res.setHeader('set-cookie', single);
    }
  } catch (e) {
    // ignore
  }

  const buf = await response.arrayBuffer();
  const text = Buffer.from(buf).toString();
  if (contentType && contentType.includes('application/json')) {
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch (e) {
      // fall through and send raw
    }
  }

  // send as text
  return res.send(text);
}
