import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Account } from '../modules/accounts/account.entity';
import { Transaction } from '../modules/transactions/transaction.entity';

function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT;
  const db = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const pass = process.env.POSTGRES_PASSWORD;
  if (host && port && db && user && pass) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
  }
  return undefined;
}

const databaseUrl =
  resolveDatabaseUrl() || 'postgresql://postgres:postgres@localhost:5432/postgres';
const synchronize = process.env.TYPEORM_SYNCHRONIZE
  ? process.env.TYPEORM_SYNCHRONIZE === 'true'
  : true;

export const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities: [User, Account, Transaction],
  synchronize,
};
