const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

module.exports = async function supabaseAuth(req, res, next) {
  try {
    const token =
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', '')) ||
      (req.cookies && req.cookies.token);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { sub: data.user.id, email: data.user.email };
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
