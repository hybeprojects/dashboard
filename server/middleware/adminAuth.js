const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const JWT = require('jsonwebtoken');
const cookie = require('cookie');

// Accepts either server JWT cookie (token) or Supabase access token via Authorization Bearer or cookie 'sb-access-token'
module.exports = async function adminAuth(req, res, next) {
  try {
    // 1) If server JWT cookie present, verify and allow (existing admin pattern)
    const serverToken = req.cookies && req.cookies.token;
    if (serverToken) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const decoded = JWT.verify(serverToken, secret);
          // allow if decoded exists; in production validate role from DB if needed
          req.user = { sub: decoded.sub, email: decoded.email, source: 'server' };
          return next();
        } catch (e) {
          // continue to Supabase check
        }
      }
    }

    // 2) Check Authorization header
    const authHeader = req.headers.authorization || '';
    let token = null;
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();

    // 3) Check cookie 'sb-access-token' (Supabase client stores in local storage but some apps set cookie)
    if (!token && req.headers.cookie) {
      const cookies = cookie.parse(req.headers.cookie || '');
      token = cookies['sb-access-token'] || cookies['sb:token'] || cookies['supabase-auth-token'];
    }

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Validate token with Supabase service client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return res.status(500).json({ error: 'Supabase not configured' });

    const supabase = createClient(url, key);

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid supabase token' });
    }

    const user = data.user;
    // Determine admin: check user_metadata.is_admin or environment ADMIN_EMAILS
    const isAdminMeta = user.user_metadata && user.user_metadata.is_admin === true;
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
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
