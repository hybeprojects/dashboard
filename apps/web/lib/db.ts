import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./premier_bank.db';
const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev_secret';

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  const filePath = DATABASE_URL.startsWith('file:') ? DATABASE_URL.slice(5) : DATABASE_URL;

  // dynamic require to avoid bundler resolving native sqlite3 at build-time
  let sqlite3: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sqlite3 = require('sqlite3');
  } catch (e) {
    throw new Error('sqlite3 module is not installed. Run `npm install sqlite3` in apps/web');
  }

  const db = await open({ filename: filePath, driver: sqlite3.Database });
  dbInstance = db;
  await ensureSchema(db);
  return db;
}

async function ensureSchema(db: any) {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Profiles mirror
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Minimal accounts and transactions for future use
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      balance REAL DEFAULT 0,
      currency TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_account_id TEXT,
      to_account_id TEXT,
      amount REAL,
      currency TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // KYC submissions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      files TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function createUser({
  email,
  password,
  firstName,
  lastName,
}: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const db = await getDb();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase());
  if (existing) throw new Error('User already exists');
  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  await db.run(
    'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
    id,
    email.toLowerCase(),
    hash,
    firstName || null,
    lastName || null,
  );
  // create profile
  await db.run(
    'INSERT OR REPLACE INTO profiles (id, user_id, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
    id,
    id,
    email.toLowerCase(),
    firstName || null,
    lastName || null,
  );
  return {
    id,
    email: email.toLowerCase(),
    firstName: firstName || null,
    lastName: lastName || null,
  };
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const row = await db.get(
    'SELECT id, email, password_hash, first_name as firstName, last_name as lastName FROM users WHERE email = ?',
    email.toLowerCase(),
  );
  return row || null;
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

export function createSessionToken(userId: string) {
  const payload = { sub: userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}

export async function getUserById(id: string) {
  const db = await getDb();
  const row = await db.get(
    'SELECT id, email, first_name as firstName, last_name as lastName FROM users WHERE id = ?',
    id,
  );
  return row || null;
}

export async function upsertAccountSnapshot(userId: string, account: any) {
  const db = await getDb();
  const id = String(account.id || account.accountId || account.resourceId || account.account_number || randomUUID());
  const name = account.name || account.accountType || String(account.account_number || '');
  const balance = Number(account.balance ?? account.currentBalance ?? account.availableBalance ?? 0);
  const data = JSON.stringify(account);
  await db.run(
    `INSERT INTO accounts (id, user_id, name, balance, currency, data) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, name=excluded.name, balance=excluded.balance, currency=excluded.currency, data=excluded.data`,
    id,
    userId,
    name,
    balance,
    account.currency || null,
    data,
  );
  return id;
}

export async function getUserAccounts(userId: string) {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM accounts WHERE user_id = ?', userId);
  return rows || [];
}

export async function createTransaction(tx: any) {
  const db = await getDb();
  const id = tx.id || randomUUID();
  await db.run(
    'INSERT INTO transactions (id, from_account_id, to_account_id, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id,
    tx.from_account_id || null,
    tx.to_account_id || null,
    tx.amount || 0,
    tx.currency || null,
    tx.status || 'pending',
    tx.created_at || new Date().toISOString(),
  );
  return id;
}

export async function updateAccountBalance(accountId: string, newBalance: number) {
  const db = await getDb();
  await db.run('UPDATE accounts SET balance = ? WHERE id = ?', newBalance, accountId);
}

export async function getAccountById(accountId: string) {
  const db = await getDb();
  const row = await db.get('SELECT * FROM accounts WHERE id = ?', accountId);
  return row || null;
}
