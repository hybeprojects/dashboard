const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const auth = require('../middleware/auth');
const { transferSavings, getSavingsAccount } = require('../utils/fineractAPI');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const TX_FILE = path.join(__dirname, '..', 'data', 'transactions.json');
async function loadUsers(){ return fs.readJson(USERS_FILE).catch(()=>[]); }
async function saveUsers(u){ return fs.writeJson(USERS_FILE,u,{spaces:2}); }
async function loadTx(){ return fs.readJson(TX_FILE).catch(()=>[]); }
async function saveTx(t){ return fs.writeJson(TX_FILE,t,{spaces:2}); }

// transfer endpoint
router.post('/', auth, async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount) return res.status(400).json({ error: 'missing fields' });
    const users = await loadUsers();
    const sender = users.find((u) => u.id === req.user.sub || u.accountId == fromAccountId);
    if (!sender) return res.status(404).json({ error: 'sender not found' });
    const receiver = users.find((u) => u.accountId == toAccountId);
    if (!receiver) return res.status(404).json({ error: 'receiver not found' });
    // validate balance via fineract
    const fromAccount = await getSavingsAccount(fromAccountId).catch(() => null);
    const bal = Number(fromAccount?.summary?.availableBalance || 0);
    if (bal < Number(amount)) return res.status(400).json({ error: 'insufficient funds' });
    // call fineract transfer
    const out = await transferSavings({ fromAccountId: Number(fromAccountId), toAccountId: Number(toAccountId), transferAmount: Number(amount) }).catch((e)=>{ throw e; });
    // record transaction locally
    const txs = await loadTx();
    const tx = { id: Date.now().toString(), fromUserId: sender.id, toUserId: receiver.id, fromAccountId, toAccountId, amount, date: new Date().toISOString() };
    txs.unshift(tx);
    await saveTx(txs);

    // emit via socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(receiver.id).emit('notification', { message: `You received $${amount} from ${sender.firstName || sender.email}` });
      io.to(sender.id).emit('transfer', { ...tx, newBalance: (bal - Number(amount)) });
      io.to(receiver.id).emit('transfer', { ...tx, newBalance: null });
    }

    return res.json({ success: true, fineract: out, tx });
  } catch (e) {
    console.error('transfer error', e?.response?.data || e.message || e);
    return res.status(500).json({ error: 'transfer failed', details: e?.message || e });
  }
});

module.exports = router;
