const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');

const NOT_FILE = path.join(__dirname, '..', 'data', 'notifications.json');
async function load() {
  return fs.readJson(NOT_FILE).catch(() => []);
}
async function save(n) {
  return fs.writeJson(NOT_FILE, n, { spaces: 2 });
}

router.get('/', auth, async (req, res) => {
  const all = await load();
  const mine = all.filter((n) => n.userId === req.user.sub);
  return res.json({ notifications: mine });
});

router.patch('/read', auth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
  const all = await load();
  for (const id of ids) {
    const item = all.find((x) => x.id === id && x.userId === req.user.sub);
    if (item) item.read = true;
  }
  await save(all);
  return res.json({ success: true });
});

module.exports = router;
