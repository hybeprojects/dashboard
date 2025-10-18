const { createClient } = require('@supabase/supabase-js');
const cookie = require('cookie');
const fs = require('fs-extra');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
async function loadUsers() {
  return fs.readJson(USERS_FILE).catch(() => []);
}

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Accept Supabase access token from Authorization Bearer or cookie (sb-access-token)
    const authHeader = req.headers.authorization || '';
    let token = null;
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();

    if (!token && req.headers.cookie) {
      const cookies = cookie.parse(req.headers.cookie || '');
      token = cookies['sb-access-token'] || cookies['sb:token'] || cookies['supabase-auth-token'];
    }

    if (!token) return res.status(401).json({ error: 'Unauthorized - no token' });

    const supabase = getSupabaseServer();
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid supabase token' });
    }

    const sbUser = data.user;

    // Map to app user stored in data/users.json
    const users = await loadUsers();
    const appUser = users.find((u) => u.supabaseId === sbUser.id || u.email === sbUser.email);
    if (!appUser) {
      return res.status(401).json({ error: 'Profile setup required' });
    }

    // Set req.user.sub to the app user id for compatibility with existing routes
    req.user = { sub: appUser.id, email: appUser.email, supabaseId: sbUser.id };
    return next();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('auth middleware error', e && e.message ? e.message : e);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
