const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const csrf = require('../middleware/csrf');
const rateLimit = require('express-rate-limit');
const { transferFunds, getAccountBalance, getSavingsAccount } = require('../utils/fineractAPI');
const logger = require('../utils/logger');

const SYS_FILE = path.join(__dirname, '..', 'data', 'system.json');
const store = require('../utils/store');

async function loadSys() {
  return fs.readJson(SYS_FILE).catch(() => ({}));
}

const transferLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function emit(io, userId, event, payload) {
  try {
    io.to(userId).emit(event, payload);
  } catch (_) {
    /* noop */
  }
}

async function scheduleSettlement(io, tx) {
  let attempts = 0;
  const doSettle = async () => {
    try {
      const sys = await loadSys();
      const clearingId = process.env.CLEARING_ACCOUNT_ID || sys.clearingAccountId;
      await transferFunds(Number(clearingId), Number(tx.toAccountId), Number(tx.amount));
      // mark transaction completed in store
      await store.updateTransactionById(tx.id, {
        status: 'completed',
        settled_at: new Date().toISOString(),
      }).catch(() => null);

      // balances for receiver
      let receiverBalance = null;
      try {
        receiverBalance = await getAccountBalance(tx.toAccountId);
      } catch (_) {}

      emit(io, tx.toUserId, 'transfer', {
        ...tx,
        newBalance: receiverBalance,
        type: 'transfer:completed',
      });
      emit(io, tx.fromUserId, 'transfer', { ...tx, type: 'transfer:settled' });
    } catch (e) {
      attempts += 1;
      if (attempts < Number(process.env.MAX_SETTLEMENT_RETRIES || 3)) {
        const backoff = Number(process.env.SETTLEMENT_DELAY_MS || 10000) * Math.pow(2, attempts);
        setTimeout(doSettle, backoff);
      } else {
        await store.updateTransactionById(tx.id, { status: 'failed', error: e?.message || 'settlement failed' }).catch(() => null);
        emit(io, tx.toUserId, 'notification', {
          id: uuidv4(),
          userId: tx.toUserId,
          type: 'error',
          message: 'Incoming transfer failed to settle.',
          data: { txId: tx.id },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  };
  setTimeout(doSettle, Number(process.env.SETTLEMENT_DELAY_MS || 10000));
}

router.post('/', auth, csrf, transferLimiter, async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, memo } = req.body;
    if (!fromAccountId || !toAccountId || !amount)
      return res.status(400).json({ error: 'missing fields' });
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'invalid amount' });

    const users = await loadUsers();
    const sender = users.find(
      (u) => u.id === req.user.sub || String(u.accountId) === String(fromAccountId),
    );
    const receiver = users.find((u) => String(u.accountId) === String(toAccountId));
    if (!sender) return res.status(404).json({ error: 'sender not found' });
    if (!receiver) return res.status(404).json({ error: 'receiver not found' });

    if (String(fromAccountId) === String(toAccountId)) {
      return res.status(400).json({ error: 'sender and receiver accounts cannot be the same' });
    }

    const sys = await loadSys();
    const clearingId = process.env.CLEARING_ACCOUNT_ID || sys.clearingAccountId;
    if (!clearingId) return res.status(500).json({ error: 'clearing account not configured' });

    // balance check
    const available = await getAccountBalance(fromAccountId).catch(() => 0);
    if (Number(available) < amt) return res.status(400).json({ error: 'insufficient funds' });

    // 1) immediate: sender -> clearing
    const clearingRef = await transferFunds(Number(fromAccountId), Number(clearingId), amt);

    // create app transaction (posted for sender, pending for receiver)
    const tx = {
      id: uuidv4(),
      fromUserId: sender.id,
      fromAccountId: Number(fromAccountId),
      toUserId: receiver.id,
      toAccountId: Number(toAccountId),
      amount: amt,
      currency: 'USD',
      status: 'posted_sent',
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
      settledAt: null,
      fineractClearingRef: clearingRef,
      fineractSettlementRef: null,
      memo: memo || null,
      retries: 0,
    };
    const txs = await loadTx();
    txs.unshift(tx);
    await saveTx(txs);

    // balances
    let senderBal = null;
    try {
      senderBal = await getAccountBalance(fromAccountId);
    } catch (_) {}

    // emit events
    const io = req.app.get('io');
    emit(io, sender.id, 'transfer', { ...tx, newBalance: senderBal, type: 'transfer:posted' });
    emit(io, receiver.id, 'transfer', {
      id: tx.id,
      fromName: sender.firstName || sender.email,
      amount: amt,
      status: 'pending',
      createdAt: tx.createdAt,
      toUserId: receiver.id,
      toAccountId: toAccountId,
      fromUserId: sender.id,
      fromAccountId: fromAccountId,
      type: 'transfer:incoming_pending',
    });

    // schedule settlement
    scheduleSettlement(io, tx);

    return res.json({ ok: true, tx });
  } catch (e) {
    logger.error('transfer error', e?.response?.data || e.message || e);
    return res.status(500).json({ error: 'transfer failed', details: e?.message || e });
  }
});

module.exports = router;
