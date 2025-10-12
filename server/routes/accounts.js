const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { getSavingsAccount, createSavingsAccount } = require('../utils/fineractAPI');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
async function loadUsers() {
  return fs.readJson(USERS_FILE).catch(() => []);
}
async function saveUsers(u) {
  return fs.writeJson(USERS_FILE, u, { spaces: 2 });
}

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
  return res.json({
    accounts: [
      {
        id: user.accountId || null,
        balance: acct?.summary?.availableBalance || 0,
        owner: { id: user.id, email: user.email },
      },
    ],
  });
});

// create a new savings account for user
router.post('/', auth, async (req, res) => {
  const users = await loadUsers();
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const savings = await createSavingsAccount(user.fineractClientId).catch((e) => null);
  if (!savings) return res.status(500).json({ error: 'could not create account' });
  const newId = savings.savingsId || savings.resourceId || savings.id;
  user.accountId = newId;
  await saveUsers(users);
  return res.json({ accountId: newId });
});

module.exports = router;
