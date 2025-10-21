import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
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

    // attach Supabase access token if available
    try {
      // lazy import to avoid SSR issues
      const { getSupabase } = await import('./supabase');
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
  } catch (e) {
    // non-fatal
  }
  return config;
});

export default api;
