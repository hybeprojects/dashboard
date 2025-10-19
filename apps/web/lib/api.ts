import axios from 'axios';
import axios from 'axios';
import Cookies from 'js-cookie';

// Resolve a sensible base URL for the API in the browser/dev/prod.
// Priority: NEXT_PUBLIC_API_URL env var -> window.location.origin (same origin APIs) -> http://localhost:5000
const inferredOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const RESOLVED_BASE =
  process.env.NEXT_PUBLIC_API_URL || (inferredOrigin ? inferredOrigin : 'http://localhost:5000');

const api = axios.create({
  baseURL: RESOLVED_BASE,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    // XSRF token if present
    const token = Cookies.get('XSRF-TOKEN');
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-XSRF-TOKEN'] = token;
    }
  } catch (e) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn('Failed to attach auth headers to request', e);
  }
  return config;
});

export default api;
