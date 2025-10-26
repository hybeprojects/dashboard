import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple in-memory rate limiter (per-process). Note: Edge middleware runs per instance.
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 60;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Paths to exclude from global enforcement
const EXEMPT_PATHS = ['/api/csrf-token', '/api/env-check', '/api/debug', '/api/auth'];

function isExempt(pathname: string) {
  for (const p of EXEMPT_PATHS) {
    if (pathname === p) return true;
    if (pathname.startsWith(p + '/')) return true;
  }
  return false;
}

function getIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || '';
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export async function middleware(req: NextRequest) {
  const { method } = req;
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Only protect API routes
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // Exempt certain public API paths
  if (isExempt(pathname)) return NextResponse.next();

  // Rate limiting
  try {
    const ip = getIp(req);
    const key = `${ip}:${pathname}:${method}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      bucket.count += 1;
      if (bucket.count > LIMIT) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        res.headers.set('Retry-After', String(Math.max(1, retryAfterSec)));
        return res;
      }
    }
  } catch (e) {
    // ignore rate limiter errors and continue
  }

  // CSRF double-submit verification for non-safe methods
  if (!SAFE_METHODS.has(method)) {
    try {
      const headerToken = req.headers.get('x-xsrf-token') || req.headers.get('x-xsrftoken') || '';
      const cookieToken = req.cookies.get('XSRF-TOKEN')?.value || '';
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
    }
  }

  // Authentication guard for admin/db endpoints: ensure session cookie present and token valid
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/db')) {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';
    if (!secret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    try {
      const token = await getToken({ req, secret, secureCookie: process.env.NODE_ENV === 'production' });
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // Detailed RBAC (is_admin) checks should run inside API handlers (server-side DB) where DB access is available.
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
