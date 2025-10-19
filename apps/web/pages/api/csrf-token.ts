import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      return res.status(500).json({ error: 'API base URL not configured' });
    }

    const target = `${apiBase.replace(/\/$/, '')}/csrf-token`;

    // Forward incoming cookies to the API so the remote can see the client's session.
    const headers: Record<string, string> = {
      accept: (req.headers.accept as string) || 'application/json',
    };
    if (req.headers.cookie) headers.cookie = req.headers.cookie as string;

    const response = await fetch(target, {
      method: 'GET',
      headers,
    });

    // Forward status
    res.status(response.status);

    // Forward relevant headers
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    // Forward Set-Cookie headers if present
    // response.headers.raw() is available on some fetch implementations; try to use it.
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
      // Multiple Set-Cookie values should be set as an array
      res.setHeader('set-cookie', setCookie as string[]);
    }

    // Stream response body back
    const body = await response.text();
    res.send(body);
  } catch (err: any) {
    console.error('Error proxying CSRF token:', err?.message || err);
    res.status(502).json({ error: 'Bad gateway' });
  }
}
