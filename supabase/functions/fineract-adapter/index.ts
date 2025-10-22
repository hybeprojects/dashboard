import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const FINERACT_URL = Deno.env.get('FINERACT_URL');
const FINERACT_USERNAME = Deno.env.get('FINERACT_USERNAME');
const FINERACT_PASSWORD = Deno.env.get('FINERACT_PASSWORD');
const FINERACT_TENANT_ID = Deno.env.get('FINERACT_TENANT_ID');

if (!FINERACT_URL || !FINERACT_USERNAME || !FINERACT_PASSWORD) {
  console.warn(
    'Fineract adapter: FINERACT_URL/USERNAME/PASSWORD not fully configured; adapter will fail',
  );
}
if (!SERVICE_ROLE)
  console.warn(
    'Fineract adapter: SUPABASE_SERVICE_ROLE_KEY not configured; some admin actions will fail',
  );

// Whitelist of allowed path prefixes to protect abuse. Extend as needed.
const ALLOWED_PREFIXES = [
  '/accounts',
  '/clients',
  '/loans',
  '/transactions',
  '/users',
  '/customers',
];
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function isAllowedPath(path: string) {
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const supabaseUrl = SUPABASE_URL!;
    const supabaseAnon = SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseAnon)
      return new Response(JSON.stringify({ error: 'Server misconfigured (supabase)' }), {
        status: 500,
      });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // Verify user and check role (is_admin) using anon client with the provided token
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const userRes = await userClient.auth.getUser();
    if (!userRes.data?.user)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const userId = userRes.data.user.id;
    // check admin flag
    const { data: profile, error: profileErr } = await userClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    if (profileErr) {
      console.error('Failed to load profile', profileErr.message || profileErr);
    }
    const isAdmin = !!(profile && (profile as any).is_admin);

    // parse incoming payload
    let payload: any;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const { path, method = 'GET', query, body } = payload || {};
    if (!path || typeof path !== 'string')
      return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400 });

    if (!isAllowedPath(path))
      return new Response(JSON.stringify({ error: 'Path not allowed' }), { status: 403 });

    const m = String(method).toUpperCase();
    if (!ALLOWED_METHODS.includes(m))
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    // For mutating operations require admin
    const mutating = m !== 'GET';
    if (mutating && !isAdmin)
      return new Response(JSON.stringify({ error: 'Admin required' }), { status: 403 });

    // Build target
    const base = FINERACT_URL!.replace(/\/$/, '');
    const url = new URL(base + (path.startsWith('/') ? path : '/' + path));
    if (query && typeof query === 'object') {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    // Basic auth for Fineract
    const basic = btoa(`${FINERACT_USERNAME}:${FINERACT_PASSWORD}`);
    const headers: Record<string, string> = {
      Authorization: `Basic ${basic}`,
      Accept: 'application/json',
    };
    if (FINERACT_TENANT_ID) headers['X-TENANT-ID'] = FINERACT_TENANT_ID;

    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url.toString(), {
      method: m,
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const contentType = res.headers.get('content-type') || 'application/json';

    const responseInit: ResponseInit = {
      status: res.status,
      headers: { 'content-type': contentType },
    };
    return new Response(text, responseInit);
  } catch (e: any) {
    console.error('Fineract adapter error', e?.message || e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
