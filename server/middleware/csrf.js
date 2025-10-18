const cookie = require('cookie');
const crypto = require('crypto');

// Double-submit cookie CSRF protection middleware
module.exports = function csrfMiddleware(req, res, next) {
  // Safe methods do not require CSRF
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-xsrf-token'] || req.headers['x-xsrf-token'.toLowerCase()];
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const cookieToken = cookies['XSRF-TOKEN'] || cookies['XSRF_TOKEN'] || cookies['xsrf-token'];

  if (!cookieToken || !headerToken) return res.status(403).json({ error: 'Missing CSRF token' });
  if (String(cookieToken) !== String(headerToken)) return res.status(403).json({ error: 'Invalid CSRF token' });
  return next();
};
