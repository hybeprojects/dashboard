const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const fineractAPI = require('../utils/fineractAPI');
const { v4: uuidv4 } = require('uuid');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
async function loadUsers() {
  return fs.readJson(USERS_FILE).catch(() => []);
}
async function saveUsers(u) {
  await fs.ensureDir(path.join(__dirname, '..', 'data'));
  return fs.writeJson(USERS_FILE, u, { spaces: 2 });
}

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return require('@supabase/supabase-js').createClient(url, key);
}

// POST /auth/setup-profile
// Expects Authorization: Bearer <supabase_access_token>
// Creates an app-level user mapping for the Supabase user (new users only)
router.post('/setup-profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
    const token = authHeader.slice(7).trim();

    const supabase = getSupabaseServer();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return res.status(401).json({ error: 'Invalid token' });

    const sbUser = data.user;

    // Ensure not already mapped
    const users = await loadUsers();
    let appUser = users.find((u) => u.supabaseId === sbUser.id || u.email === sbUser.email);
    if (appUser) {
      return res.json({ user: appUser });
    }

    // Create Fineract client and savings account where possible
    let fineractClient = null;
    let accountId = null;
    try {
      fineractClient = await fineractAPI.createClient({ firstName: sbUser.user_metadata?.first_name || sbUser.email?.split('@')[0], lastName: sbUser.user_metadata?.last_name || '' });
      const savings = await fineractAPI.createSavingsAccount(fineractClient.clientId).catch(() => null);
      accountId = savings ? (savings.savingsId || savings.resourceId || savings.id) : null;
    } catch (e) {
      // ignore fineract failures but continue
      accountId = null;
    }

    // Create app user record
    const newUser = {
      id: uuidv4(),
      email: sbUser.email,
      firstName: sbUser.user_metadata?.first_name || null,
      lastName: sbUser.user_metadata?.last_name || null,
      supabaseId: sbUser.id,
      fineractClientId: fineractClient?.clientId || null,
      accountId: accountId || null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users);

    return res.json({ user: newUser });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('setup-profile error', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Failed to setup profile' });
  }
});

// Deprecate older JWT routes: respond with guidance
router.post('/signup', (_req, res) => res.status(410).json({ error: 'Use Supabase Auth for signup' }));
router.post('/login', (_req, res) => res.status(410).json({ error: 'Use Supabase Auth for login' }));
router.post('/refresh', (_req, res) => res.status(410).json({ error: 'Use Supabase Auth for session refresh' }));
router.post('/logout', (_req, res) => res.status(410).json({ error: 'Use Supabase Auth for logout' }));

module.exports = router;
