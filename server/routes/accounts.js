const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { getSavingsAccount, createSavingsAccount } = require('../utils/fineractAPI');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
async function loadUsers() { return fs.readJson(USERS_FILE).catch(() => []); }
async function saveUsers(u){ return fs.writeJson(USERS_FILE,u,{spaces:2}); }

// list accounts for authenticated user
router.get('/', auth, async (req, res) => {
  const users = await loadUsers();
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'user not found' });
  // fetch fineract account info if available
  let acct = null;
  if (user.accountId) {
    acct = await getSavingsAccount(user.accountId).catch(() => null);
  }
  // return app-level account object
  return res.json({ accounts: [ { id: user.accountId || null, balance: acct?.summary?.availableBalance || 0, owner: { id: user.id, email: user.email } } ] });
});

// create a new savings account for user
router.post('/', auth, async (req, res) => {
  const users = await loadUsers();
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const payload = { clientId: user.fineractClientId, productId: 1, accountNo: `SAV-${Date.now()}`, fieldOfficerId: 1 };
  const savings = await createSavingsAccount(payload).catch((e) => null);
  if (!savings) return res.status(500).json({ error: 'could not create account' });
  user.accountId = savings.savingsId;
  await saveUsers(users);
  return res.json({ accountId: savings.savingsId });
});

module.exports = router;
