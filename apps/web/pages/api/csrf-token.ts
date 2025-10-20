import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

function buildCookie(token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [`XSRF-TOKEN=${token}`, 'Path=/', 'Max-Age=3600', 'SameSite=Lax'];
  if (isProd) parts.push('Secure');
  // httpOnly must be false for double-submit cookie pattern (readable by JS)
  // Don't set HttpOnly
  return parts.join('; ');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const fallbackLocal = 'http://localhost:5000';
    const targets: string[] = [];
    if (apiBase) targets.push(`${apiBase.replace(/\/$/, '')}/csrf-token`);
    targets.push(`${fallbackLocal.replace(/\/$/, '')}/csrf-token`);

    // Forward incoming cookies to the API so the remote can see the client's session.
    const headers: Record<string, string> = {
      accept: (req.headers.accept as string) || 'application/json',
    };
    if (req.headers.cookie) headers.cookie = req.headers.cookie as string;

    let response: Response | null = null;
    let lastError: any = null;

    for (const t of targets) {
      try {
        // attempt fetch
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(t, { method: 'GET', headers });
        // treat 2xx as success; otherwise try next
        if (r.ok) {
          response = r;
          break;
        }
        // capture non-ok responses to inspect later (e.g., 404)
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
      // Nothing succeeded
      console.error('CSRF proxy: all targets failed', lastError);
      // In production we fail hard; in dev allow a local fallback so frontend can continue
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({ error: 'Bad gateway' });
      }

      try {
        const token = crypto.randomBytes(24).toString('hex');
        res.setHeader('Set-Cookie', buildCookie(token));
        return res.status(200).json({ csrfToken: token, fallback: true, error: String(lastError) });
      } catch (e) {
        return res.status(502).json({ error: 'Bad gateway' });
      }
    }

    // Forward status
    res.status(response.status);

    // Forward relevant headers
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    // Forward Set-Cookie headers if present
    const setCookies: string[] = [];
    const anyHeaders: any = (response as any).headers;
    if (anyHeaders && typeof anyHeaders.raw === 'function') {
      try {
        const raw = anyHeaders.raw();
        if (raw && Array.isArray(raw['set-cookie'])) setCookies.push(...raw['set-cookie']);
      } catch (e) {
        // ignore
      }
    } else {
      const single = response.headers.get('set-cookie');
      if (single) setCookies.push(single);
    }
    if (setCookies.length) res.setHeader('set-cookie', setCookies as string[]);

    // Stream response body back
    const body = await response.text();
    // If content-type is json, try to parse and send as JSON to keep types consistent
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(body);
        return res.json(json);
      } catch (e) {
        // fallthrough to send raw body
      }
    }

    res.send(body);
  } catch (err: any) {
    console.error('Error proxying CSRF token:', err?.message || err);
    // As a last resort, issue a local token so the frontend can continue in dev
    try {
      const token = crypto.randomBytes(24).toString('hex');
      res.setHeader('Set-Cookie', buildCookie(token));
      return res.status(200).json({ csrfToken: token, fallback: true, error: String(err) });
    } catch (e) {
      res.status(502).json({ error: 'Bad gateway' });
    }
  }
}
