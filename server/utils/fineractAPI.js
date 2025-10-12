const axios = require('axios');
const base = process.env.FINERACT_BASE_URL || 'http://localhost:8080/fineract-provider/api/v1';
const user = process.env.FINERACT_USER || 'mifos';
const pass = process.env.FINERACT_PASSWORD || 'password';

function authHeader() {
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

async function createClient(payload) {
  // payload: { firstname, lastname, officeId }
  const url = `${base}/clients`;
  const res = await axios.post(url, payload, { headers: authHeader() });
  return res.data;
}

async function createSavingsAccount(payload) {
  // payload must follow Fineract savings account create contract
  const url = `${base}/savingsaccounts`;
  const res = await axios.post(url, payload, { headers: authHeader() });
  return res.data;
}

async function getSavingsAccount(accountId) {
  const url = `${base}/savingsaccounts/${accountId}`;
  const res = await axios.get(url, { headers: authHeader() });
  return res.data;
}

async function transferSavings({ fromAccountId, toAccountId, transferAmount }) {
  // Fineract may expose an endpoint for transfer - use savingsaccounts/transfer
  const url = `${base}/savingsaccounts/transfer`;
  const body = { fromSavingAccountId: fromAccountId, toSavingAccountId: toAccountId, transferAmount };
  const res = await axios.post(url, body, { headers: authHeader() });
  return res.data;
}

async function getClient(clientId) {
  const url = `${base}/clients/${clientId}`;
  const res = await axios.get(url, { headers: authHeader() });
  return res.data;
}

module.exports = { createClient, createSavingsAccount, getSavingsAccount, transferSavings, getClient };
