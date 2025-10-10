const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fineract = require('../utils/fineractAPI');
const store = require('../store');
const io = require('../sockets/transferSocket').getIO();

// Simple in-memory ledger used for demo and fallback
// POST /transfer { fromAccountId, toAccountId, amount }
router.post('/', auth, async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount) return res.status(400).json({ error: 'Missing fields' });

    // Attempt to call Fineract transfer endpoint
    const payload = { fromSavingsAccountId: fromAccountId, toSavingsAccountId: toAccountId, transferAmount: amount };
    const resp = await fineract.transferSavings(payload).catch((e) => null);

    const tx = {
      id: `tx_${Date.now()}`,
      fromAccountId,
      toAccountId,
      amount,
      status: resp ? 'success' : 'pending',
      createdAt: new Date()
    };

    store.ledger.push(tx);

    // Emit socket events to inform clients
    if (io) {
      io.emit('transfer', tx);
      io.emit('notification', { message: `Transfer of $${amount} from ${fromAccountId} to ${toAccountId}`, tx });
    }

    res.json({ tx, fineract: !!resp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
