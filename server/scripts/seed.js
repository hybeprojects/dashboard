const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { createClient, createSavingsAccount, depositToSavings } = require('../utils/fineractAPI');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SYS_FILE = path.join(DATA_DIR, 'system.json');

async function loadUsers() { return fs.readJson(USERS_FILE).catch(() => []); }
async function saveUsers(u) { await fs.ensureDir(DATA_DIR); return fs.writeJson(USERS_FILE, u, { spaces: 2 }); }
async function loadSys() { return fs.readJson(SYS_FILE).catch(() => ({})); }
async function saveSys(s) { await fs.ensureDir(DATA_DIR); return fs.writeJson(SYS_FILE, s, { spaces: 2 }); }

async function ensureClearingAccount() {
  const sys = await loadSys();
  if (process.env.CLEARING_ACCOUNT_ID) {
    sys.clearingAccountId = Number(process.env.CLEARING_ACCOUNT_ID);
    await saveSys(sys);
    return sys.clearingAccountId;
  }
  if (sys.clearingAccountId) return sys.clearingAccountId;
  // create a bank-controlled client and savings as clearing
  const client = await createClient({ firstName: 'Bank', lastName: 'Clearing', email: `clearing-${Date.now()}@example.com` });
  const savings = await createSavingsAccount(client.clientId);
  const id = savings.savingsId || savings.resourceId || savings.id;
  sys.clearingAccountId = id;
  await saveSys(sys);
  console.log('Clearing account created:', id);
  return id;
}

async function ensureUser(firstName, email, openingDeposit = 0) {
  const users = await loadUsers();
  let user = users.find((u) => u.email === email);
  if (user && user.accountId) {
    console.log('User exists:', email);
    return user;
  }
  if (!user) {
    user = { id: uuidv4(), firstName, lastName: 'Demo', email, password: await bcrypt.hash('password123', 10) };
    users.push(user);
  }
  const client = await createClient({ firstName, lastName: 'Demo', email });
  user.fineractClientId = client.clientId;
  const savings = await createSavingsAccount(client.clientId);
  const acctId = savings.savingsId || savings.resourceId || savings.id;
  user.accountId = acctId;
  await saveUsers(users);
  if (openingDeposit > 0) {
    await depositToSavings(acctId, openingDeposit);
    console.log(`Deposited $${openingDeposit} to ${email}`);
  }
  return user;
}

(async function run() {
  try {
    await fs.ensureDir(DATA_DIR);
    await ensureClearingAccount();
    await ensureUser('Alice', 'alice@example.com', 500000);
    await ensureUser('Bob', 'bob@example.com', 0);
    await ensureUser('Charlie', 'charlie@example.com', 0);
    console.log('Seed complete');
  } catch (e) {
    console.error('Seed failed', e?.response?.data || e.message || e);
    process.exit(1);
  }
})();
