const axios = require('axios');
const qs = require('qs');

const baseURL = process.env.FINERACT_BASE_URL || 'http://localhost:8080/fineract-provider/api/v1';
const username = process.env.FINERACT_USERNAME || 'mifos';
const password = process.env.FINERACT_PASSWORD || 'password';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Attach basic auth header via interceptor
api.interceptors.request.use((config) => {
  config.auth = { username, password };
  return config;
});

async function withRetry(fn, retries = 3, backoff = 300) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, backoff * attempt));
    }
  }
}

module.exports = {
  api,
  createClient: async (clientPayload) => {
    const resp = await withRetry(() => api.post('/clients', clientPayload));
    return resp.data;
  },
  createSavingsAccount: async (payload) => {
    const resp = await withRetry(() => api.post('/savingsaccounts', payload));
    return resp.data;
  },
  transferSavings: async (payload) => {
    // endpoint /savingsaccounts/transfer
    const resp = await withRetry(() => api.post('/savingsaccounts/transfer', payload));
    return resp.data;
  },
  getSavingsAccount: async (accountId) => {
    const resp = await withRetry(() => api.get(`/savingsaccounts/${accountId}`));
    return resp.data;
  },
  getAccountTransactions: async (accountId) => {
    const resp = await withRetry(() => api.get(`/savingsaccounts/${accountId}/transactions`));
    return resp.data;
  },
};
