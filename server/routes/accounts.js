const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { getSavingsAccount, createSavingsAccount } = require('../utils/fineractAPI');
const csrf = require('../middleware/csrf');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const store = require('../utils/store');
async function loadUsers() {
  // kept for compatibility but prefer store.getUserBySupabaseId
  return [];
}
async function saveUsers(u) {
  // noop: persistence should be in Supabase
  return null;
}

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// list accounts for authenticated user
router.get('/', auth, async (req, res) => {
  // Load the user's app record from Supabase (app_users or profiles)
  const user = await store.getUserBySupabaseId(req.user.sub).catch(() => null);
  if (!user) return res.status(404).json({ error: 'user not found' });
  // fetch fineract account info if available
  let acct = null;
  const acctId = user.account_id || user.accountId || user.fineract_account_id || user.accountId;
  if (acctId) {
    acct = await getSavingsAccount(acctId).catch(() => null);
  }
  // return app-level account object
  return res.json({
    accounts: [
      {
        id: acctId || null,
        balance: acct?.summary?.availableBalance || 0,
        owner: { id: user.id, email: user.email },
      },
    ],
  });
});

// create a new savings account for user
router.post('/', auth, csrf, createLimiter, async (req, res) => {
  const user = await store.getUserBySupabaseId(req.user.sub).catch(() => null);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const fineractClientId = user.fineract_client_id || user.fineractClientId || user.fineract_clientid || null;
  const savings = await createSavingsAccount(fineractClientId).catch((e) => null);
  if (!savings) return res.status(500).json({ error: 'could not create account' });
  const newId = savings.savingsId || savings.resourceId || savings.id;
  // persist account mapping back to Supabase
  try {
    await store.upsertAppUser({ id: user.id, account_id: newId, fineract_client_id: fineractClientId });
  } catch (e) {
    logger.warn('Failed to persist account mapping to Supabase', e && (e.message || e));
  }
  return res.json({ accountId: newId });
});

module.exports = router;
