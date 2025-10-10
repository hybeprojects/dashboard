const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fineract = require('../utils/fineractAPI');

const secret = process.env.JWT_SECRET || 'change_this_secret';

// In-memory store for demo (maps email -> user)
const users = require('../store').users;

// Signup: create client in Fineract and create a savings account
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (users[email]) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = bcrypt.hashSync(password, 8);

    // create client in Fineract
    const clientPayload = {
      officeId: 1,
      activationDate: new Date().toISOString().split('T')[0],
      firstname: name,
      lastname: '',
      mobileNumber: '',
      legalForm: 1,
    };
    const clientResp = await fineract.createClient(clientPayload).catch((e) => null);

    // create savings account linked to client (use payload that Fineract expects)
    const savingsPayload = {
      clientId: clientResp && clientResp.resourceId ? clientResp.resourceId : null,
      savingsProductId: 1,
      fieldOfficerId: 1,
      submittedOnDate: new Date().toISOString().split('T')[0],
    };

    let savingsResp = null;
    if (savingsPayload.clientId) {
      savingsResp = await fineract.createSavingsAccount(savingsPayload).catch((e) => null);
    }

    const user = {
      id:
        clientResp && clientResp.resourceId ? String(clientResp.resourceId) : `local_${Date.now()}`,
      name,
      email,
      passwordHash,
      fineractClientId: clientResp && clientResp.resourceId ? clientResp.resourceId : null,
      savingsAccountId: savingsResp && savingsResp.resourceId ? savingsResp.resourceId : null,
      createdAt: new Date(),
    };

    users[email] = user;

    const token = jwt.sign({ email, id: user.id, name: user.name }, secret, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ email, id: user.id, name: user.name }, secret, { expiresIn: '7d' });
  res.json({ token, user });
});

module.exports = router;
