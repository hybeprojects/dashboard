const axios = require('axios');
const qs = require('qs');

const baseURL = process.env.FINERACT_BASE_URL || 'http://localhost:8080/fineract-provider/api/v1';
const username = process.env.FINERACT_USERNAME || 'mifos';
const password = process.env.FINERACT_PASSWORD || 'password';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach basic auth header via interceptor
api.interceptors.request.use((config) => {
  config.auth = { username, password };
  return config;
});

module.exports = {
  api,
  createClient: async (clientPayload) => {
    const resp = await api.post('/clients', clientPayload);
    return resp.data;
  },
  createSavingsAccount: async (payload) => {
    const resp = await api.post('/savingsaccounts', payload);
    return resp.data;
  },
  transferSavings: async (payload) => {
    // endpoint /savingsaccounts/transfer
    const resp = await api.post('/savingsaccounts/transfer', payload);
    return resp.data;
  },
  getSavingsAccount: async (accountId) => {
    const resp = await api.get(`/savingsaccounts/${accountId}`);
    return resp.data;
  },
  getAccountTransactions: async (accountId) => {
    const resp = await api.get(`/savingsaccounts/${accountId}/transactions`);
    return resp.data;
  }
};
