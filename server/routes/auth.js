const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient, createSavingsAccount } = require('../utils/fineractAPI');
const { v4: uuidv4 } = require('uuid');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const db = require('../utils/db');

async function loadUsers() {
  const exists = await fs.pathExists(USERS_FILE);
  if (!exists) return [];
  return fs.readJson(USERS_FILE);
}
async function saveUsers(users) {
  await fs.ensureFile(USERS_FILE);
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing email/password' });
    const hashed = await bcrypt.hash(password, 10);

    // create Fineract client
    const clientPayload = { firstname: firstName || email.split('@')[0], lastname: lastName || '' };
    const fineractClient = await createClient(clientPayload).catch((e) => null);
    const clientId = fineractClient?.clientId || null;
    // create savings account in Fineract
    const savingsPayload = { clientId: clientId, productId: 1 };
    const savings = clientId ? await createSavingsAccount(savingsPayload).catch((e) => null) : null;
    const accountId = savings?.savingsId || null;

    // If DB is available, insert into DB, otherwise fallback to file
    if (db && db.isAvailable && db.isAvailable()) {
      const userId = uuidv4();
      const schema = process.env.PERSONAL_SCHEMA || 'personal_users_db';
      await db.query(
        `INSERT INTO ${schema}.users (id, first_name, last_name, email, password_hash, fineract_client_id) VALUES (?, ?, ?, ?, ?, ?);`,
        [userId, firstName || null, lastName || null, email, hashed, clientId],
      );
      const [acctRes] = await db.query(
        `INSERT INTO ${schema}.accounts (user_id, fineract_account_id, balance) VALUES (?, ?, ?);`,
        [userId, accountId || null, 0],
      );
      const token = jwt.sign({ sub: userId, email }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
      return res.json({ accessToken: token, user: { id: userId, email, firstName, lastName } });
    }

    const users = await loadUsers();
    if (users.find((u) => u.email === email)) return res.status(400).json({ error: 'user exists' });
    const user = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashed,
      fineractClientId: clientId,
      accountId,
    };
    users.push(user);
    await saveUsers(users);
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      accessToken: token,
      user: { id: user.id, email: user.email, firstName, lastName },
    });
  } catch (e) {
    console.error('signup error', e.message || e);
    return res.status(500).json({ error: 'signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (db && db.isAvailable && db.isAvailable()) {
      const schema = process.env.PERSONAL_SCHEMA || 'personal_users_db';
      const [rows] = await db.query(`SELECT * FROM ${schema}.users WHERE email = ? LIMIT 1;`, [
        email,
      ]);
      const user = rows && rows[0];
      if (!user) return res.status(401).json({ error: 'invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid credentials' });
      const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
      return res.json({
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    }

    const users = await loadUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      accessToken: token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'login failed' });
  }
});

// resend / link-status simple implementation
const RESEND_FILE = path.join(__dirname, '..', 'data', 'resend.json');
async function loadResend() {
  return fs.readJson(RESEND_FILE).catch(() => ({}));
}
async function saveResend(r) {
  return fs.writeJson(RESEND_FILE, r, { spaces: 2 });
}

router.post('/resend', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, message: 'email required' });
  const key = String(email).toLowerCase();
  const store = await loadResend();
  const now = Date.now();
  const rec = store[key] || { perMin: 0, perDay: 0, lastSent: null, lastTs: 0 };
  // reset per-minute if >60s
  if (rec.lastTs && now - rec.lastTs > 60000) rec.perMin = 0;
  // reset perDay if past 24h
  if (rec.lastTs && now - rec.lastTs > 24 * 60 * 60 * 1000) rec.perDay = 0;
  rec.perMin += 1;
  rec.perDay += 1;
  rec.lastTs = now;
  rec.lastSent = new Date(now).toISOString();
  store[key] = rec;
  await saveResend(store);
  return res.json({ ok: true, message: 'sent', lastSent: rec.lastSent });
});

router.get('/link-status', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.json({ attemptsToday: 0, lastSent: null });
  const key = String(email).toLowerCase();
  const store = await loadResend();
  const rec = store[key] || { perMin: 0, perDay: 0, lastSent: null };
  return res.json({ attemptsToday: rec.perDay || 0, lastSent: rec.lastSent || null });
});

// minimal me endpoint
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.json({ user: null });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.json({ user: null });
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    const users = await loadUsers();
    const user = users.find((u) => u.id === decoded.sub);
    if (!user) return res.json({ user: null });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
      },
    });
  } catch (e) {
    return res.json({ user: null });
  }
});

router.post('/logout', async (req, res) => {
  return res.json({ success: true });
});

module.exports = router;
