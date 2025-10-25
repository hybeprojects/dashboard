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

    // Do not attempt to attach JWT from httpOnly cookie; rely on cookies being sent via withCredentials
  } catch (e) {
    // non-fatal
  }
  return config;
});

// Response interceptor to provide user-friendly errors and capture to Sentry if available
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    try {
      // attempt to capture to Sentry if present
      try {
        const Sentry = await import('@sentry/react');
        if (Sentry && Sentry.captureException) {
          Sentry.captureException(err);
        }
      } catch (e) {
        // ignore if Sentry not available
      }

      // normalize error message
      const resp = err?.response;
      let message = 'Network error';
      if (resp) {
        const data = resp.data;
        if (data) {
          if (typeof data === 'string') message = data;
          else if (data.error) message = data.error;
          else if (data.message) message = data.message;
          else message = JSON.stringify(data);
        } else {
          message = resp.statusText || String(resp.status);
        }
      } else if (err?.message) {
        message = err.message;
      }

      return Promise.reject(new Error(message));
    } catch (e) {
      return Promise.reject(err);
    }
  },
);

export default api;
