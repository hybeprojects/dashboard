require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// initialize DB
const db = require('./utils/db');
(async () => {
  await db.init();
})();

// mount routes
app.use('/auth', require('./routes/auth'));
app.use('/accounts', require('./routes/accounts'));
app.use('/transactions', require('./routes/transactions'));
app.use('/notifications', require('./routes/notifications'));
app.use('/transfer', require('./routes/transfer'));

app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', db: db.isAvailable() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dashboard server listening on http://localhost:${PORT}`);
});
