import axios from 'axios';
import Cookies from 'js-cookie';

// Resolve a sensible base URL for the API in the browser/dev/prod.
// Priority: NEXT_PUBLIC_API_URL env var -> window.location.origin (same origin APIs) -> http://localhost:5000
const inferredOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const RESOLVED_BASE = process.env.NEXT_PUBLIC_API_URL || (inferredOrigin ? inferredOrigin : 'http://localhost:5000');

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
    // Attach bearer token if present in localStorage (useful for APIs requiring Authorization)
    if (typeof window !== 'undefined') {
      const bearer = localStorage.getItem('token');
      if (bearer) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${bearer}`;
      }
    }
  } catch (e) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn('Failed to attach auth headers to request', e);
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network or CORS errors often come through with no response
    if (!error.response) {
      // Provide a clearer error for the UI/logs
      // eslint-disable-next-line no-console
      console.error('Network or CORS error when connecting to API at', RESOLVED_BASE, error.message || error);
      return Promise.reject(new Error(`Network error: failed to reach API at ${RESOLVED_BASE}. Check server availability and CORS settings.`));
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function (resolve, reject) {
        api
          .post('/auth/refresh')
          .then(({ data }) => {
            processQueue(null, data.accessToken);
            resolve(axios(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            reject(err);
          })
          .then(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);

export default api;
