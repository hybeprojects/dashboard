import getSupabase from './supabase';

type CallOpts = {
  method?: string;
  query?: Record<string, string | number | boolean> | null;
  body?: any;
  // If true, treat response as text and return it directly
  rawText?: boolean;
};

/**
 * Call the Supabase Edge Function `fineract-adapter` which proxies requests to Fineract.
 * The adapter requires an Authorization header (Bearer <supabase access token>).
 * This helper automatically attaches the current session access token and invokes
 * the Edge Function using the Supabase client.
 */
export async function callFineract(path: string, opts: CallOpts = {}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not available (must call from browser)');

  const sessionResp = await supabase.auth.getSession();
  const access = (sessionResp as any)?.data?.session?.access_token;
  if (!access) throw new Error('No active session found; please sign in');

  const payload: any = { path, method: opts.method || 'GET' };
  if (opts.query) payload.query = opts.query;
  if (opts.body !== undefined) payload.body = opts.body;

  const headers: Record<string, string> = { Authorization: `Bearer ${access}` };

  // use Supabase Functions invoke API — this sends to the named Edge Function
  const fnName = 'fineract-adapter';
  const invokeResp = await supabase.functions.invoke(fnName, {
    body: payload,
    headers,
  });

  if ((invokeResp as any).error) {
    // invoke API surface may return an error object
    const err = (invokeResp as any).error;
    throw new Error(err?.message || JSON.stringify(err));
  }

  // invokeResp.data may be a string or already-parsed object depending on the function
  const data = (invokeResp as any).data;
  if (opts.rawText) return String(data);

  // Try to parse string responses as JSON, otherwise return as-is
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data;
}

// Convenience wrappers
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
