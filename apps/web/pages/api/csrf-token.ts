import type { NextApiRequest, NextApiResponse } from 'next';

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
        lastError = { status: r.status, statusText: r.statusText };
      } catch (e) {
        lastError = e;
      }
    }

    if (!response) {
      // Nothing succeeded
      console.error('CSRF proxy: all targets failed', lastError);
      return res.status(502).json({ error: 'Bad gateway' });
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
    res.status(502).json({ error: 'Bad gateway' });
  }
}
