require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', db: db.isAvailable() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Listen on all interfaces (important for Codespaces/Docker)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dashboard server listening on port ${PORT}`);
});
