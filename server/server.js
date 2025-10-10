require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;

// simple store and seed helper
const store = require('./store');

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transfer', require('./routes/transfer'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/notifications', require('./routes/notifications'));

const server = http.createServer(app);
const sockets = require('./sockets/transferSocket');
const io = sockets.init(server);

// Seed demo users if none exist
async function seedDemo() {
  if (Object.keys(store.users).length) return;
  const demoNames = ['alice', 'bob', 'charlie', 'diana', 'evan'];
  demoNames.forEach((name, i) => {
    const email = `${name}@example.com`;
    store.users[email] = {
      id: `local_${i}_${Date.now()}`,
      name,
      email,
      passwordHash: '$2a$08$u1qT0k1ZrB6y5QwY6YjUeO',
      fineractClientId: null,
      savingsAccountId: null,
      createdAt: new Date(),
    };
  });
  console.log('Seeded demo users');
}

seedDemo();

server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

module.exports = server;
