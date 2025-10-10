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

    // persist to Supabase if available
    try {
      const supabase = require('../lib/supabaseClient');
      if (supabase) {
        await supabase.from('app_users').insert([
          { id: user.id, name: user.name, email: user.email, fineract_client_id: user.fineractClientId, created_at: new Date() }
        ]);
      }
    } catch (e) {
      console.warn('Failed to persist user to Supabase', e && e.message ? e.message : e);
    }

    const token = jwt.sign({ email, id: user.id, name: user.name }, secret, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // ensure Supabase record exists
  try {
    const supabase = require('../lib/supabaseClient');
    if (supabase) {
      const { data } = await supabase.from('app_users').select('id').eq('id', user.id).limit(1);
      if (!data || data.length === 0) {
        await supabase.from('app_users').insert([{ id: user.id, name: user.name, email: user.email, fineract_client_id: user.fineractClientId }]);
      }
    }
  } catch (e) {
    console.warn('Supabase persist/login check failed', e && e.message ? e.message : e);
  }

  const token = jwt.sign({ email, id: user.id, name: user.name }, secret, { expiresIn: '7d' });
  res.json({ token, user });
});

// Supabase exchange (compatibility shim)
router.post('/supabase', (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Missing accessToken' });
  // For demo purposes, map any valid accessToken to a seeded demo user if available
  const allUsers = Object.values(users);
  const demo = allUsers.length ? allUsers[0] : null;
  if (!demo) return res.status(404).json({ error: 'No users available' });
  const token = jwt.sign({ email: demo.email, id: demo.id, name: demo.name }, secret, {
    expiresIn: '7d',
  });
  res.json({ accessToken: token, user: demo });
});

// Simple resend endpoint used by frontend for magic-link flows (no-op here)
router.post('/resend', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
