const axios = require('axios');
require('dotenv').config();

const {
  FINERACT_BASE_URL,
  FINERACT_USERNAME,
  FINERACT_PASSWORD,
  FINERACT_TENANT,
} = process.env;

// Create a preconfigured Axios instance
const fineract = axios.create({
  baseURL: FINERACT_BASE_URL,
  headers: {
    'Fineract-Platform-TenantId': FINERACT_TENANT || 'default',
    'Content-Type': 'application/json',
  },
  auth: {
    username: FINERACT_USERNAME,
    password: FINERACT_PASSWORD,
  },
});

// ─────────────────────────────
// 🔑 AUTH / CONNECTION TEST
// ─────────────────────────────
async function testConnection() {
  try {
    const res = await fineract.get('/clients');
    console.log('✅ Connected to Apache Fineract:', res.status);
    return true;
  } catch (err) {
    console.error('❌ Fineract connection failed:', err.response?.data || err.message || err);
    return false;
  }
}

// ─────────────────────────────
// 👤 CREATE CLIENT
// ─────────────────────────────
async function createClient(user) {
  try {
    const payload = {
      firstname: user.firstName,
      lastname: user.lastName || 'User',
      externalId: user.email,
      activationDate: new Date().toISOString().split('T')[0],
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
      submittedOnDate: new Date().toISOString().split('T')[0],
      officeId: 1, // default office
    };

    const { data } = await fineract.post('/clients', payload);
    console.log('✅ Client created:', data.clientId);
    return data;
  } catch (err) {
    console.error('❌ Error creating client:', err.response?.data || err.message || err);
    throw err;
  }
}

// ─────────────────────────────
// 💰 CREATE SAVINGS ACCOUNT
// ─────────────────────────────
async function createSavingsAccount(clientId) {
  try {
    const payload = {
      clientId,
      productId: 1, // Adjust to your Fineract product ID for checking accounts
      locale: 'en',
      dateFormat: 'yyyy-MM-dd',
      submittedOnDate: new Date().toISOString().split('T')[0],
      nominalAnnualInterestRate: 0,
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 1,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      minRequiredOpeningBalance: 0,
      lockinPeriodFrequency: 0,
      lockinPeriodFrequencyType: 0,
      withdrawalFeeForTransfers: false,
      enforceMinRequiredBalance: false,
    };

    const { data } = await fineract.post('/savingsaccounts', payload);
    console.log('✅ Savings account created:', data.savingsId);
    return data;
  } catch (err) {
    console.error('❌ Error creating savings account:', err.response?.data || err.message || err);
    throw err;
  }
}

// ─────────────────────────────
// 💸 TRANSFER FUNDS
// ─────────────────────────────
async function transferFunds(fromAccountId, toAccountId, amount) {
  try {
    const payload = {
      fromAccountId,
      toAccountId,
      transferAmount: amount,
      transferDescription: `Transfer of $${amount}`,
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
      transferDate: new Date().toISOString().split('T')[0],
    };

    const { data } = await fineract.post('/savingsaccounts/transfer', payload);
    console.log('✅ Transfer completed:', data);
    return data;
  } catch (err) {
    console.error('❌ Transfer failed:', err.response?.data || err.message || err);
    throw err;
  }
}

// ─────────────────────────────
// 📄 GET SAVINGS ACCOUNT (raw)
// ─────────────────────────────
async function getSavingsAccount(accountId) {
  try {
    const { data } = await fineract.get(`/savingsaccounts/${accountId}`);
    return data;
  } catch (err) {
    console.error('❌ Error fetching savings account:', err.response?.data || err.message || err);
    throw err;
  }
}

// ─────────────────────────────
// 💵 GET ACCOUNT BALANCE
// ─────────────────────────────
async function getAccountBalance(accountId) {
  try {
    const { data } = await fineract.get(`/savingsaccounts/${accountId}`);
    const balance = data?.summary?.availableBalance ?? data?.summary?.accountBalance ?? 0;
    return Number(balance) || 0;
  } catch (err) {
    console.error('❌ Error fetching account balance:', err.response?.data || err.message || err);
    throw err;
  }
}

// ─────────────────────────────
// ➕ DEPOSIT INTO SAVINGS
// ─────────────────────────────
async function depositToSavings(accountId, amount) {
  try {
    const payload = {
      transactionDate: new Date().toISOString().split('T')[0],
      dateFormat: 'yyyy-MM-dd',
      locale: 'en',
      transactionAmount: Number(amount),
    };
    const { data } = await fineract.post(`/savingsaccounts/${accountId}/transactions?command=deposit`, payload);
    return data;
  } catch (err) {
    console.error('❌ Deposit failed:', err.response?.data || err.message || err);
    throw err;
  }
}

module.exports = {
  testConnection,
  createClient,
  createSavingsAccount,
  transferFunds,
  getAccountBalance,
  getSavingsAccount,
  depositToSavings,
};
