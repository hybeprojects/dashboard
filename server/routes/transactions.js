const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');

// simple transaction store (in-memory file for demo)
const TX_FILE = path.join(__dirname, '..', 'data', 'transactions.json');
async function loadTx() {
  return fs.readJson(TX_FILE).catch(() => []);
}
async function saveTx(txs) {
  return fs.writeJson(TX_FILE, txs, { spaces: 2 });
}

router.get('/', auth, async (req, res) => {
  const txs = await loadTx();
  const userId = req.user.sub;
  const my = txs.filter((t) => t.fromUserId === userId || t.toUserId === userId);
  return res.json({ transactions: my });
});

module.exports = router;
