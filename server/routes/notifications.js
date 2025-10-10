const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const store = require('../store');

// GET /notifications
router.get('/', auth, (req, res) => {
  const email = req.user.email;
  const notifs = store.notifications[email] || [];
  res.json({ notifications: notifs });
});

// POST /notifications/mark-read { id }
router.post('/mark-read', auth, (req, res) => {
  const email = req.user.email;
  const { id } = req.body;
  if (!store.notifications[email]) return res.json({ ok: true });
  store.notifications[email] = store.notifications[email].map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  res.json({ ok: true });
});

module.exports = router;
