const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const store = require('../utils/store');

router.get('/', auth, async (req, res) => {
  try {
    const all = await store.listNotificationsForUser(req.user.sub);
    return res.json({ notifications: all });
  } catch (e) {
    console.error('notifications list error', e && (e.message || e));
    return res.status(500).json({ error: 'Failed to list notifications' });
  }
});

router.patch('/read', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
    await store.markNotificationsRead(req.user.sub, ids);
    return res.json({ success: true });
  } catch (e) {
    console.error('notifications mark read error', e && (e.message || e));
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

module.exports = router;
