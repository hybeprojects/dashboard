import { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Account } from '../modules/accounts/account.entity';
import { Transaction } from '../modules/transactions/transaction.entity';

export const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Account, Transaction],
  synchronize: true,
};
