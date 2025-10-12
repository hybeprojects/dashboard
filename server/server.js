require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PATCH'] },
});

// ensure data dir exists
const DATA_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR);

// middleware
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});
app.use(limiter);

// attach io
app.set('io', io);

// sockets registration
try {
  const registerSockets = require('./sockets/transferSocket');
  registerSockets(io);
} catch (e) {
  console.warn('Socket registration failed', e.message || e);
}

// routes
const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const transferRoutes = require('./routes/transfer');
const notificationsRoutes = require('./routes/notifications');

// health route
const { testConnection } = require('./utils/fineractAPI');
app.get(['/health', '/api/health'], async (req, res) => {
  const ok = await testConnection();
  const sysFile = path.join(DATA_DIR, 'system.json');
  const sys = await fs.readJson(sysFile).catch(() => ({}));
  return res.json({ ok, clearingAccountId: process.env.CLEARING_ACCOUNT_ID || sys.clearingAccountId || null });
});

app.use('/auth', authRoutes);
app.use(['/accounts', '/api/accounts'], accountsRoutes);
app.use(['/transactions', '/api/transactions'], transactionsRoutes);
app.use(['/transfer', '/api/transfer'], transferRoutes);
app.use(['/notifications', '/api/notifications'], notificationsRoutes);

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => {
  console.log(`API server listening on :${PORT}`);
});
