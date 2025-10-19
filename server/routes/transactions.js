const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const store = require('../utils/store');

// Return transactions for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const txs = await store.listTransactionsForUser(userId);
    return res.json({ transactions: txs || [] });
  } catch (e) {
    console.error('transactions list error', e && (e.message || e));
    return res.status(500).json({ error: 'Failed to list transactions' });
  }
});

module.exports = router;
