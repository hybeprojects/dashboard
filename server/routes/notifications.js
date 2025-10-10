const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const store = require('../store');

// GET /notifications
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const supabase = require('../lib/supabaseClient');
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ notifications: data || [] });
    }
  } catch (e) {
    console.warn(
      'Supabase notifications read failed, falling back to in-memory',
      e && e.message ? e.message : e,
    );
  }
  const notifs = store.notifications[userId] || [];
  res.json({ notifications: notifs });
});

// POST /notifications/mark-read { id }
router.post('/mark-read', auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.body;
  try {
    const supabase = require('../lib/supabaseClient');
    if (supabase) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', userId);
      return res.json({ ok: true });
    }
  } catch (e) {
    console.warn(
      'Supabase notifications mark-read failed, falling back to in-memory',
      e && e.message ? e.message : e,
    );
  }

  if (!store.notifications[userId]) return res.json({ ok: true });
  store.notifications[userId] = store.notifications[userId].map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  res.json({ ok: true });
});

module.exports = router;
