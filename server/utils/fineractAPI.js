const axios = require('axios');
const logger = require('./logger');

const { FINERACT_BASE_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT } = process.env;

const fineract = axios.create({ baseURL: FINERACT_BASE_URL, timeout: 10000 });

async function connect() {
  try {
    const res = await fineract.get('/clients');
    logger.info('Connected to Apache Fineract:', `status=${res.status}`);
    return true;
  } catch (e) {
    logger.warn('Failed to connect to Fineract', e && e.message ? e.message : e);
    return false;
  }
}

async function createClient(payload) {
  const body = { firstname: payload.firstName || payload.first || 'Anon', lastname: payload.lastName || payload.last || '' };
  const res = await fineract.post('/clients', body).catch((e) => ({ data: null, error: e }));
  if (res.error) throw res.error;
  logger.info('Client created');
  return res.data;
}

async function createSavingsAccount(clientId) {
  const payload = { clientId, productId: 1 };
  const res = await fineract.post('/savingsaccounts', payload).catch((e) => ({ data: null, error: e }));
  if (res.error) throw res.error;
  logger.info('Savings account created');
  return res.data;
}

async function transferFunds(fromId, toId, amount) {
  const payload = { fromId, toId, amount };
  const res = await fineract.post('/savingsaccounts/transfer', payload).catch((e) => ({ data: null, error: e }));
  if (res.error) throw res.error;
  logger.info('Transfer completed');
  return res.data;
}

module.exports = { connect, createClient, createSavingsAccount, transferFunds };
