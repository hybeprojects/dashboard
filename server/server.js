require('dotenv').config();

const logger = require('./utils/logger');

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
// Apply a reasonable CSP for API surface
const cspConnect = ["'self'"];
if (process.env.NEXT_PUBLIC_SUPABASE_URL) cspConnect.push(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (process.env.NEXT_PUBLIC_API_URL) cspConnect.push(process.env.NEXT_PUBLIC_API_URL);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: cspConnect,
    },
  }),
);
app.use((req, res, next) => {
  // Enforce HSTS for HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (server-to-server, curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-XSRF-TOKEN',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
  }),
);
app.use(express.json());
app.use(cookieParser());

// CSRF token issuer endpoint (double-submit cookie pattern)
app.get('/csrf-token', (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60, // 1 hour
  });
  return res.json({ csrfToken: token });
});

const PORT = process.env.PORT || 5000;

// Initialize DB
const db = require('./utils/db');
(async () => {
  await db.init();
})();

// Mount routes
app.use('/auth', require('./routes/auth'));
app.use('/accounts', require('./routes/accounts'));
app.use('/transactions', require('./routes/transactions'));
app.use('/notifications', require('./routes/notifications'));
app.use('/transfer', require('./routes/transfer'));
// KYC upload and admin endpoints
app.use('/kyc', require('./routes/kyc'));
app.use('/admin/kyc', require('./routes/admin_kyc'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', db: db.isAvailable() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err && err.message ? err.message : err);
  res.status(500).json({ error: 'internal server error' });
});

// Listen on all interfaces (important for Codespaces/Docker)
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Dashboard server listening on port ${PORT}`);
});
