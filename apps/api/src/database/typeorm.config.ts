import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Account } from '../modules/accounts/account.entity';
import { Transaction } from '../modules/transactions/transaction.entity';
import { Notification } from '../modules/notifications/notification.entity';
import { AuditLog } from '../modules/audit/audit.entity';
import { RefreshToken } from '../modules/auth/refresh-token.entity';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const synchronize = process.env.TYPEORM_SYNCHRONIZE === 'true';

export const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities: [User, Account, Transaction, Notification, AuditLog, RefreshToken],
  synchronize,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
