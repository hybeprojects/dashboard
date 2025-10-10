const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const store = require('../store');

// GET /transactions - return ledger entries involving the user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // For demo, filter ledger by account ids that match user's id (since we used clientId as user.id)
    const entries = store.ledger.filter((tx) => tx.fromAccountId == userId || tx.toAccountId == userId);
    res.json({ transactions: entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
