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
    if (!apiBase) {
      // If no API base is configured, fallback to issuing a local token for dev ergonomics
      const token = crypto.randomBytes(24).toString('hex');
      res.setHeader('Set-Cookie', buildCookie(token));
      return res.status(200).json({ csrfToken: token, fallback: true });
    }

    const target = `${apiBase.replace(/\/$/, '')}/csrf-token`;

    // Forward incoming cookies to the API so the remote can see the client's session.
    const headers: Record<string, string> = {
      accept: (req.headers.accept as string) || 'application/json',
    };
    if (req.headers.cookie) headers.cookie = req.headers.cookie as string;

    let response: Response | null = null;
    try {
      response = await fetch(target, {
        method: 'GET',
        headers,
      });
    } catch (err) {
      // If remote fetch fails (network error / unreachable), fall back to local token
      const token = crypto.randomBytes(24).toString('hex');
      res.setHeader('Set-Cookie', buildCookie(token));
      return res.status(200).json({ csrfToken: token, fallback: true });
    }

    // If the remote returned a non-success status, fall back locally instead of returning opaque 4xx/5xx
    if (!response || response.status >= 400) {
      const token = crypto.randomBytes(24).toString('hex');
      res.setHeader('Set-Cookie', buildCookie(token));
      return res.status(200).json({ csrfToken: token, fallback: true, remoteStatus: response?.status });
    }

    // Forward status
    res.status(response.status);

    // Forward relevant headers
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    // Forward Set-Cookie headers if present
    const anyHeaders: any = (response as any).headers;
    let setCookie: string[] | undefined;
    if (anyHeaders && typeof anyHeaders.raw === 'function') {
      const raw = anyHeaders.raw();
      setCookie = raw && raw['set-cookie'];
    } else {
      const single = response.headers.get('set-cookie');
      if (single) setCookie = [single];
    }
    if (setCookie && setCookie.length) {
      res.setHeader('set-cookie', setCookie as string[]);
    }

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
