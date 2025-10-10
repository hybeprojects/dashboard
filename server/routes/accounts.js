const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fineract = require('../utils/fineractAPI');
const users = require('../store').users;

// List accounts for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const email = req.user.email;
    const user = users[email];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If user has a savingsAccountId, fetch details
    const accounts = [];
    if (user.savingsAccountId) {
      const acct = await fineract.getSavingsAccount(user.savingsAccountId).catch(() => null);
      if (acct) accounts.push({ id: user.savingsAccountId, raw: acct });
    }
    res.json({ accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create additional account
router.post('/', auth, async (req, res) => {
  try {
    const email = req.user.email;
    const user = users[email];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const payload = {
      clientId: user.fineractClientId,
      savingsProductId: 1,
      fieldOfficerId: 1,
      submittedOnDate: new Date().toISOString().split('T')[0],
    };
    const resp = await fineract.createSavingsAccount(payload).catch((e) => null);
    if (resp && resp.resourceId) {
      // attach to user (for demo we only store one primary)
      user.savingsAccountId = resp.resourceId;
      res.json({ accountId: resp.resourceId });
    } else {
      res.status(500).json({ error: 'Failed to create account' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
