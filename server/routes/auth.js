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
    const users = await loadUsers();
    if (users.find((u) => u.email === email)) return res.status(400).json({ error: 'user exists' });
    const hashed = await bcrypt.hash(password, 10);
    // create Fineract client
    const clientPayload = { firstname: firstName || email.split('@')[0], lastname: lastName || '' };
    const fineractClient = await createClient(clientPayload).catch((e) => null);
    const clientId = fineractClient?.clientId || null;
    // create savings account in Fineract following typical contract (this is sandbox sample)
    const savingsPayload = {
      clientId: clientId,
      productId: 1,
      accountNo: `SAV-${Date.now()}`,
      fieldOfficerId: 1
    };
    const savings = clientId ? await createSavingsAccount(savingsPayload).catch((e) => null) : null;
    const accountId = savings?.savingsId || null;

    const user = { id: uuidv4(), firstName, lastName, email, password: hashed, fineractClientId: clientId, accountId };
    users.push(user);
    await saveUsers(users);
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ accessToken: token, user: { id: user.id, email: user.email, firstName, lastName } });
  } catch (e) {
    console.error('signup error', e.message || e);
    return res.status(500).json({ error: 'signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await loadUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ accessToken: token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'login failed' });
  }
});

module.exports = router;
