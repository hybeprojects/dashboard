import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import * as yup from 'yup';
import { getUserFromRequest } from './serverAuth';
import { getDb } from './db';

export type ApiMiddleware = (handler: NextApiHandler) => NextApiHandler;

function isSafeMethod(method?: string) {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

export function withCsrfVerify(): ApiMiddleware {
  return (handler) => async (req: NextApiRequest, res: NextApiResponse) => {
    if (isSafeMethod(req.method)) return handler(req, res);
    try {
      const headerToken = (req.headers['x-xsrf-token'] as string) || '';
      const cookiesHeader = (req.headers.cookie as string) || '';
      const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
      const cookieToken = cookies['XSRF-TOKEN'] || '';
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
      }
      return handler(req, res);
    } catch (e) {
      return res.status(403).json({ error: 'CSRF verification failed' });
    }
  };
}

// Simple in-memory rate limiter (per-process). For serverless, limits apply per instance.
const buckets = new Map<string, { count: number; resetAt: number }>();

export type RateLimitOptions = {
  windowMs?: number;
  limit?: number;
  keyGenerator?: (req: NextApiRequest) => string;
};

export function withRateLimit(opts: RateLimitOptions = {}): ApiMiddleware {
  const windowMs = opts.windowMs ?? 60_000;
  const limit = opts.limit ?? 60;
  const keyGen =
    opts.keyGenerator ??
    ((req) => {
      const fwd = (req.headers['x-forwarded-for'] as string) || '';
      const ip = fwd.split(',')[0].trim() || (req.socket as any)?.remoteAddress || 'unknown';
      const route = (req.url || '').split('?')[0];
      return `${ip}:${route}:${req.method}`;
    });
  return (handler) => async (req: NextApiRequest, res: NextApiResponse) => {
    const key = keyGen(req);
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > limit) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
        return res.status(429).json({ error: 'Too many requests' });
      }
    }
    return handler(req, res);
  };
}

export function withAuth(): ApiMiddleware {
  return (handler) => async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    (req as any).user = user;
    return handler(req, res);
  };
}

async function isAdmin(userId: string) {
  const db = await getDb();
  const row = await db.get('SELECT is_admin as isAdmin FROM profiles WHERE id = ?', userId);
  return !!(row && row.isAdmin);
}

export function withRBAC(
  required: {
    role?: 'admin' | 'user';
    allow?: (req: NextApiRequest) => Promise<boolean> | boolean;
  } = {},
): ApiMiddleware {
  return (handler) => async (req: NextApiRequest, res: NextApiResponse) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (required.role === 'admin') {
      const ok = await isAdmin(user.id);
      if (!ok) return res.status(403).json({ error: 'Forbidden' });
    }
    if (required.allow) {
      const extra = await required.allow(req);
      if (!extra) return res.status(403).json({ error: 'Forbidden' });
    }
    return handler(req, res);
  };
}

export function withValidation<T extends yup.AnyObjectSchema>(
  schema: T,
  target: 'body' | 'query' = 'body',
): ApiMiddleware {
  return (handler) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const data = target === 'body' ? req.body : req.query;
      const parsed = await schema.validate(data, { abortEarly: false, stripUnknown: true });
      if (target === 'body') (req as any).body = parsed;
      else (req as any).query = parsed;
      return handler(req, res);
    } catch (e: any) {
      const details = e?.errors || [e?.message || 'Invalid request'];
      return res.status(400).json({ error: 'Validation failed', details });
    }
  };
}

export function compose(handler: NextApiHandler, ...middlewares: ApiMiddleware[]): NextApiHandler {
  return middlewares.reduceRight((acc, mw) => mw(acc), handler);
}
