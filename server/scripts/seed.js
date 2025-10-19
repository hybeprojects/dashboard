const fs = require('fs-extra');
const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { createClient, createSavingsAccount, depositToSavings } = require('../utils/fineractAPI');
const store = require('../utils/store');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SYS_FILE = path.join(DATA_DIR, 'system.json');

async function loadSys() {
  return fs.readJson(SYS_FILE).catch(() => ({}));
}
async function saveSys(s) {
  await fs.ensureDir(DATA_DIR);
  return fs.writeJson(SYS_FILE, s, { spaces: 2 });
}

async function ensureClearingAccount() {
  const sys = await loadSys();
  if (process.env.CLEARING_ACCOUNT_ID) {
    sys.clearingAccountId = Number(process.env.CLEARING_ACCOUNT_ID);
    await saveSys(sys);
    return sys.clearingAccountId;
  }
  if (sys.clearingAccountId) return sys.clearingAccountId;
  // create a bank-controlled client and savings as clearing
  const client = await createClient({
    firstName: 'Bank',
    lastName: 'Clearing',
    email: `clearing-${Date.now()}@example.com`,
  });
  const savings = await createSavingsAccount(client.clientId);
  const id = savings.savingsId || savings.resourceId || savings.id;
  sys.clearingAccountId = id;
  await saveSys(sys);
  console.log('Clearing account created:', id);
  return id;
}

async function ensureUser(firstName, email, openingDeposit = 0) {
  // create local app user record and persist to Supabase app_users
  let user = {
    id: uuidv4(),
    firstName,
    lastName: 'Demo',
    email,
    password_hash: await bcrypt.hash('password123', 10),
  };

  const client = await createClient({ firstName, lastName: 'Demo', email });
  user.fineract_client_id = client.clientId;
  const savings = await createSavingsAccount(client.clientId);
  const acctId = savings.savingsId || savings.resourceId || savings.id;
  user.account_id = acctId;

  // Persist to Supabase app_users table (best-effort)
  try {
    await store.upsertAppUser({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      fineract_client_id: user.fineract_client_id,
      account_id: user.account_id,
      password_hash: user.password_hash,
    });
  } catch (e) {
    console.warn('Failed to persist seeded user to Supabase', e && (e.message || e));
  }

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
