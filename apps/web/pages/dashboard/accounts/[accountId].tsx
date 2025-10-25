import { GetServerSidePropsContext } from 'next';
import { withAuth } from '../../../lib/ssrHelpers';

// Define types inline instead of importing
type Account = {
  id: string;
  user_id: string;
  account_number: string;
  type: 'checking' | 'savings' | 'business' | 'loan';
  name: string;
  balance: number;
  available_balance: number;
  currency: string;
  status: string;
  interest_rate: number;
  overdraft_limit: number;
  transfer_limit_tier: 'basic' | 'standard' | 'premium' | 'unlimited';
  daily_transfer_limit: number;
  monthly_transfer_limit: number;
  used_daily_limit: number;
  used_monthly_limit: number;
  opened_at: string;
  created_at: string;
};

type Transaction = {
  id: string;
  account_id: string;
  amount: number;
  type: 'debit' | 'credit' | 'transfer' | 'payment' | 'fee';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  running_balance: number;
  created_at: string;
};

type AccountDetailsPageProps = {
  account: Account;
  transactions: Transaction[];
};

export default function AccountDetailsPage({ account, transactions }: AccountDetailsPageProps) {
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold capitalize">{account.type} Account</h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono">{account.account_number}</p>
        <p className="text-4xl font-bold mt-4">${account.balance.toFixed(2)}</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{transaction.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(transaction.created_at).toLocaleDateString()}
              </p>
            </div>
            <p
              className={`font-bold text-lg ${
                transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { getDb } from '../../../lib/db';

export const getServerSideProps = withAuth(async (context, user) => {
  const accountId = context.params?.accountId as string;

  const db = await getDb();

  const account: any = await db.get('SELECT * FROM accounts WHERE id = ?', accountId);

  const transactions: any[] = await db.all(
    'SELECT * FROM transactions WHERE from_account_id = ? OR to_account_id = ? ORDER BY created_at DESC',
    accountId,
    accountId,
  );

  if (!account) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      account,
      transactions: transactions || [],
    },
  };
});
