const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient, createSavingsAccount } = require('../utils/fineractAPI');
const { v4: uuidv4 } = require('uuid');

const { JWT_SECRET } = process.env;
const db = require('../utils/db');

const getAllowedSchema = () => {
  const allowedSchemas = ['personal_users_db', 'business_users_db'];
  const schema = process.env.PERSONAL_SCHEMA || 'personal_users_db';
  if (!allowedSchemas.includes(schema)) {
    throw new Error(`Invalid schema '${schema}' defined in PERSONAL_SCHEMA`);
  }
  return schema;
};

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const hashed = await bcrypt.hash(password, 10);

    // create Fineract client
    const clientPayload = { firstname: firstName || email.split('@')[0], lastname: lastName || '' };
    const fineractClient = await createClient(clientPayload).catch((e) => null);
    const clientId = fineractClient?.clientId || null;
    // create savings account in Fineract
    const savingsPayload = { clientId: clientId, productId: 1 };
    const savings = clientId ? await createSavingsAccount(savingsPayload).catch((e) => null) : null;
    const accountId = savings?.savingsId || null;

    const userId = uuidv4();
    const schema = getAllowedSchema();
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
  } catch (e) {
    console.error('signup error', e.message || e);
    return res.status(500).json({ error: 'signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const schema = getAllowedSchema();
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
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      accessToken: token,
    });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'login failed' });
  }
});

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

router.use('/login', authLimiter);
router.use('/signup', authLimiter);

const authMiddleware = require('../middleware/auth');

// minimal me endpoint
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const schema = getAllowedSchema();
    const [rows] = await db.query(`SELECT * FROM ${schema}.users WHERE id = ? LIMIT 1;`, [
      req.user.sub,
    ]);
    const user = rows && rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Require a valid token (do not blindly accept expired tokens).
    const decoded = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ sub: decoded.sub, email: decoded.email }, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ success: true });
  } catch (e) {
    // If token verification failed (including expiry), require re-authentication.
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
