const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const store = require('../store');

// GET /transactions - return ledger entries involving the user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // Try Supabase first
    try {
      const supabase = require('../lib/supabaseClient');
      if (supabase) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .or(`from_account_id.eq.${userId},to_account_id.eq.${userId}`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ transactions: data || [] });
      }
    } catch (e) {
      console.warn('Supabase transactions query failed, falling back to in-memory ledger', e && e.message ? e.message : e);
    }

    const entries = store.ledger.filter((tx) => tx.fromAccountId == userId || tx.toAccountId == userId);
    res.json({ transactions: entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
