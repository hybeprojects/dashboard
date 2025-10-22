import getSupabase from './supabase';

type CallOpts = {
  method?: string;
  query?: Record<string, string | number | boolean> | null;
  body?: any;
  rawText?: boolean;
};

async function getSentry() {
  try {
    const Sentry = await import('@sentry/react');
    return Sentry;
  } catch (e) {
    return null;
  }
}

/**
 * Call the Supabase Edge Function `fineract-adapter` which proxies requests to Fineract.
 */
export async function callFineract(path: string, opts: CallOpts = {}) {
  const Sentry = await getSentry();
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not available (must call from browser)');

  const sessionResp = await supabase.auth.getSession();
  const access = (sessionResp as any)?.data?.session?.access_token;
  if (!access) throw new Error('No active session found; please sign in');

  const payload: any = { path, method: opts.method || 'GET' };
  if (opts.query) payload.query = opts.query;
  if (opts.body !== undefined) payload.body = opts.body;

  const headers: Record<string, string> = { Authorization: `Bearer ${access}` };

  const fnName = 'fineract-adapter';
  try {
    const invokeResp = await supabase.functions.invoke(fnName, {
      body: payload,
      headers,
    });

    if ((invokeResp as any).error) {
      const err = (invokeResp as any).error;
      if (Sentry && Sentry.captureException) Sentry.captureException(err);
      throw new Error(err?.message || JSON.stringify(err));
    }

    const data = (invokeResp as any).data;
    if (opts.rawText) return String(data);

    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
    return data;
  } catch (e: any) {
    if (Sentry && Sentry.captureException) Sentry.captureException(e);
    throw new Error(e?.message || 'Fineract call failed');
  }
}

export async function getFineract(path: string, query?: Record<string, any>) {
  return callFineract(path, { method: 'GET', query });
}

export async function postFineract(path: string, body?: any) {
  return callFineract(path, { method: 'POST', body });
}

export async function putFineract(path: string, body?: any) {
  return callFineract(path, { method: 'PUT', body });
}

export default { callFineract, getFineract, postFineract, putFineract };
