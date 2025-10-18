const { createClient } = require('@supabase/supabase-js');
const cookie = require('cookie');
require('dotenv').config();

module.exports = async function adminAuth(req, res, next) {
  try {
    // Extract token from Authorization header or common Supabase cookie names
    const authHeader = req.headers.authorization || '';
    let token = null;
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();

    if (!token && req.headers.cookie) {
      const cookies = cookie.parse(req.headers.cookie || '');
      token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];
    }

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.status(500).json({ error: 'Supabase not configured' });

    const supabase = createClient(url, key);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid supabase token' });
    }

    const user = data.user;
    const isAdminMeta = user.user_metadata && user.user_metadata.is_admin === true;
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const isAdminEmail = adminEmails.includes(user.email);

    if (!isAdminMeta && !isAdminEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = { sub: user.id, email: user.email, source: 'supabase' };
    return next();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('adminAuth error', e.message || e);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
