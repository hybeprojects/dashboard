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
