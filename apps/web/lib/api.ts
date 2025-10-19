import axios from 'axios';
import axios from 'axios';
import Cookies from 'js-cookie';

// Resolve a sensible base URL for the API in the browser/dev/prod.
// Priority: NEXT_PUBLIC_API_URL env var -> window.location.origin (same origin APIs) -> http://localhost:5000
const inferredOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const RESOLVED_BASE =
  process.env.NEXT_PUBLIC_API_URL || (inferredOrigin ? inferredOrigin : 'http://localhost:5000');

const functionsBase =
  RESOLVED_BASE && RESOLVED_BASE.includes('.supabase.co')
    ? RESOLVED_BASE.replace('.supabase.co', '.functions.supabase.co')
    : process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '';

const api = axios.create({
  baseURL: RESOLVED_BASE,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  try {
    // XSRF token if present
    const token = Cookies.get('XSRF-TOKEN');
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-XSRF-TOKEN'] = token;
    }

    // Route certain paths to Supabase Edge Functions and attach Supabase access token
    const fnPaths = ['/transfer', '/kyc', '/admin'];
    if (config.url) {
      const matches = fnPaths.some((p) => config.url!.startsWith(p));
      if (matches && functionsBase) {
        config.baseURL = functionsBase;

        // rewrite some route paths to function names
        if (config.url!.startsWith('/kyc/'))
          config.url = config
            .url!.replace('/kyc/submit', '/kyc-upload')
            .replace('/kyc/', '/kyc-upload');
        if (config.url!.startsWith('/admin/')) config.url = '/admin-actions';
        if (config.url === '/transfer') config.url = '/transfer';

        // attach Supabase access token if available
        try {
          // lazy import to avoid SSR issues
          // eslint-disable-next-line global-require, import/no-extraneous-dependencies
          const { getSupabase } = require('./supabase');
          const supabase = getSupabase();
          if (supabase) {
            const s = await supabase.auth.getSession();
            const access = s?.data?.session?.access_token;
            if (access) {
              config.headers = config.headers || {};
              config.headers['Authorization'] = `Bearer ${access}`;
            }
          }
        } catch (e) {
          // ignore if supabase client not ready
        }
      }
    }
  } catch (e) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn('Failed to attach auth headers to request', e);
  }
  return config;
});

export default api;
