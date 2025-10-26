import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { getJwtSecret } from './env';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./premier_bank.db';
const JWT_SECRET = getJwtSecret();

let dbInstance: any = null;
let dbFilePathCached: string | null = null;

export function getDatabaseFilePath() {
  if (dbFilePathCached) return dbFilePathCached;
  const filePath = DATABASE_URL.startsWith('file:') ? DATABASE_URL.slice(5) : DATABASE_URL;
  // normalize to absolute
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  dbFilePathCached = abs;
  return abs;
}

export async function getDb() {
  if (dbInstance) return dbInstance;
  const filePath = getDatabaseFilePath();

  // dynamic require to avoid bundler resolving native sqlite3 at build-time
  let sqlite3module: any;
  try {
    sqlite3module = require('sqlite3');
  } catch (e: any) {
    throw new Error('sqlite3 module is not installed. Run `npm install sqlite3` in apps/web');
  }

  const db = await open({ filename: filePath, driver: sqlite3module.Database });

  // Harden connection: pragmas for durability and concurrency
  try {
    // Enable WAL for better concurrency
    await db.exec('PRAGMA journal_mode = WAL;');
    // Reasonable synchronous setting
    await db.exec('PRAGMA synchronous = NORMAL;');
    // Busy timeout (ms)
    await db.exec('PRAGMA busy_timeout = 5000;');
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
  } catch (e: any) {
    // ignore pragma errors but log
    // eslint-disable-next-line no-console
    console.warn('Failed to set pragmas on sqlite', e && (e.message || e));
  }

  dbInstance = db;
  await ensureSchema(db);
  return db;
}

export async function closeDb() {
  if (!dbInstance) return;
  try {
    await dbInstance.close();
  } catch (e: any) {
    // ignore
  }
  dbInstance = null;
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
      reviewed_by TEXT,
      review_note TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // App users mapping to Fineract
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT,
      fineract_client_id TEXT,
      account_id TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Audit logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      action TEXT,
      target_type TEXT,
      target_id TEXT,
      metadata TEXT,
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
  const id = String(
    account.id || account.accountId || account.resourceId || account.account_number || randomUUID(),
  );
  const name = account.name || account.accountType || String(account.account_number || '');
  const balance = Number(
    account.balance ?? account.currentBalance ?? account.availableBalance ?? 0,
  );
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

// --- Utilities for backups and maintenance ---
export async function backupDatabase(destinationFolder?: string) {
  const src = getDatabaseFilePath();
  const destFolder = destinationFolder || path.join(process.cwd(), 'storage', 'backups');
  if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.basename(src);
  const destName = `${base}.${ts}.backup`;
  const dest = path.join(destFolder, destName);

  // Ensure DB is flushed to disk
  try {
    const db = await getDb();
    // checkpoint WAL to ensure all data is in main DB
    try {
      await db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e: any) {
      // ignore
    }
  } catch (e) {
    // ignore if cannot open
  }

  fs.copyFileSync(src, dest);
  return { ok: true, path: dest, name: destName };
}

export async function restoreDatabaseFromBuffer(buffer: Buffer) {
  const dest = getDatabaseFilePath();
  // close existing db connection first
  await closeDb();

  // write to temp and then move
  const tmp = dest + '.restore.tmp';
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, dest);
  // reset cached path and instance
  dbFilePathCached = dest;
  dbInstance = null;
  return { ok: true, path: dest };
}

export async function runIntegrityCheck() {
  try {
    const db = await getDb();
    const res = await db.get('PRAGMA quick_check(1);');
    return { ok: true, result: res };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function runVacuum() {
  try {
    const db = await getDb();
    await db.exec('VACUUM;');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
