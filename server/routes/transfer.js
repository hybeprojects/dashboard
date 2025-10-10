const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fineract = require('../utils/fineractAPI');
const store = require('../store');
const ioModule = require('../sockets/transferSocket');

function getIO() {
  try {
    return ioModule.getIO();
  } catch (e) {
    return null;
  }
}

// POST /transfer { fromAccountId, toAccountId, amount }
router.post('/', auth, async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount) return res.status(400).json({ error: 'Missing fields' });

    // Attempt to call Fineract transfer endpoint (with retries in fineractAPI)
    const payload = { fromSavingsAccountId: fromAccountId, toSavingsAccountId: toAccountId, transferAmount: amount };
    let resp = null;
    try {
      resp = await fineract.transferSavings(payload);
    } catch (e) {
      console.warn('Fineract transfer failed, recording pending transaction', e && e.message ? e.message : e);
    }

    const tx = {
      id: `tx_${Date.now()}`,
      fromAccountId,
      toAccountId,
      amount,
      status: resp ? 'success' : 'pending',
      createdAt: new Date(),
    };

    // persist to Supabase if available, otherwise in-memory
    try {
      const supabase = require('../lib/supabaseClient');
      if (supabase) {
        await supabase.from('transactions').insert([
          {
            id: tx.id,
            from_account_id: tx.fromAccountId,
            to_account_id: tx.toAccountId,
            amount: tx.amount,
            status: tx.status,
            created_at: tx.createdAt,
          },
        ]);
      } else {
        store.ledger.push(tx);
      }
    } catch (e) {
      console.warn('Failed to persist transaction to Supabase, using in-memory ledger', e && e.message ? e.message : e);
      store.ledger.push(tx);
    }

    // create and persist notification
    const notif = { id: `n_${Date.now()}`, user: toAccountId, message: `You received $${amount} from ${fromAccountId}`, read: false, createdAt: new Date() };
    try {
      const supabase = require('../lib/supabaseClient');
      if (supabase) {
        await supabase.from('notifications').insert([
          { id: notif.id, user_id: notif.user, message: notif.message, read: notif.read, created_at: notif.createdAt },
        ]);
      } else {
        store.notifications[notif.user] = store.notifications[notif.user] || [];
        store.notifications[notif.user].push(notif);
      }
    } catch (e) {
      console.warn('Failed to persist notification to Supabase, storing in-memory', e && e.message ? e.message : e);
      store.notifications[notif.user] = store.notifications[notif.user] || [];
      store.notifications[notif.user].push(notif);
    }

    // Emit socket events to inform clients
    const io = getIO();
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
