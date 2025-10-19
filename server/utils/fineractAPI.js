const axios = require('axios');
const axios = require('axios');
const logger = require('./logger');

const { FINERACT_BASE_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT } = process.env;

// Configure axios with basic auth and tenant header when available
const fineract = axios.create({
  baseURL: FINERACT_BASE_URL,
  timeout: 10000,
  auth:
    FINERACT_USERNAME && FINERACT_PASSWORD
      ? { username: FINERACT_USERNAME, password: FINERACT_PASSWORD }
      : undefined,
  headers: FINERACT_TENANT ? { 'Fineract-Platform-TenantId': FINERACT_TENANT } : {},
});

async function safeRequest(promise) {
  try {
    const res = await promise;
    return { data: res.data, status: res.status };
  } catch (e) {
    // normalize axios error
    const err = e && e.response ? e.response.data || e.response : e;
    throw err;
  }
}

async function connect() {
  if (!FINERACT_BASE_URL) {
    logger.warn('FINERACT_BASE_URL not configured');
    return false;
  }
  try {
    const res = await safeRequest(fineract.get('/clients'));
    logger.info('Connected to Apache Fineract:', `status=${res.status}`);
    return true;
  } catch (e) {
    logger.warn('Failed to connect to Fineract', e && e.message ? e.message : e);
    return false;
  }
}

async function createClient(payload) {
  const body = {
    firstname: payload.firstName || payload.first || 'Anon',
    lastname: payload.lastName || payload.last || '',
  };
  const res = await safeRequest(fineract.post('/clients', body));
  logger.info('Client created');
  return res.data;
}

async function createSavingsAccount(clientId) {
  if (!clientId) throw new Error('clientId required');
  const payload = { clientId, productId: 1 };
  const res = await safeRequest(fineract.post('/savingsaccounts', payload));
  logger.info('Savings account created');
  return res.data;
}

async function getSavingsAccount(accountId) {
  if (!accountId) throw new Error('accountId required');
  // Fineract's savings account endpoint may vary; this tries common path
  const res = await safeRequest(fineract.get(`/savingsaccounts/${accountId}`));
  return res.data;
}

async function getAccountBalance(accountId) {
  try {
    const data = await getSavingsAccount(accountId);
    // common fields for balance in Fineract responses
    const summary = data?.summary || data?.accountSummary || data?.resource || null;
    const available =
      summary?.availableBalance ?? summary?.availableAmount ?? summary?.balance ?? null;
    if (available == null) {
      // try other common paths
      if (data?.summary?.availableBalance != null) return data.summary.availableBalance;
      if (data?.account?.summary?.availableBalance != null)
        return data.account.summary.availableBalance;
      return null;
    }
    return available;
  } catch (e) {
    logger.warn('Failed to fetch account balance', e && e.message ? e.message : e);
    throw e;
  }
}

async function transferFunds(fromId, toId, amount) {
  if (!fromId || !toId || !amount) throw new Error('fromId, toId and amount are required');
  const payload = { fromId, toId, amount };
  const res = await safeRequest(fineract.post('/savingsaccounts/transfer', payload));
  logger.info('Transfer completed');
  return res.data;
}

module.exports = {
  connect,
  createClient,
  createSavingsAccount,
  getSavingsAccount,
  getAccountBalance,
  transferFunds,
};
