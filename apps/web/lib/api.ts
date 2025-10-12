import axios from 'axios';

// Use relative URLs so Next.js rewrites/proxy handles routing to the Node wrapper (avoid hard-coded dev API URL)
const BASE = '';
const api = axios.create({ baseURL: BASE, timeout: 10000 });

// attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// simple retry interceptor for network errors
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);
    config.__retryCount = config.__retryCount || 0;
    const maxRetries = 2;
    const shouldRetry =
      (!error.response || error.code === 'ECONNABORTED') && config.__retryCount < maxRetries;
    if (shouldRetry) {
      config.__retryCount += 1;
      await new Promise((r) => setTimeout(r, 300 * config.__retryCount));
      return api(config);
    }
    return Promise.reject(error);
  },
);

export default api;
