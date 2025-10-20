// Supabase client will be required dynamically inside server-side props to avoid module name collisions
import { GetServerSidePropsContext } from 'next';
// Supabase client will be required dynamically inside server-side props to avoid module name collisions

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

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error('Supabase not configured for SSR');
    return { notFound: true };
  }

  // Parse cookies to extract the user's Supabase access token
  const cookiesHeader = context.req.headers.cookie || '';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cookie = require('cookie');
  const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
  const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const accountId = context.params?.accountId as string;

  // Create a user-scoped client that attaches the user's access token in the Authorization header
  // Require dynamically to avoid top-level duplicate imports and keep this code server-only
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  const userClient = createSupabaseClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Fetch account and transactions using the user's client so RLS policies apply
  const { data: account, error: accountError } = await userClient
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  const { data: transactions, error: transactionsError } = await userClient
    .from('transactions')
    .select('*')
    .or(`sender_account_id.eq.${accountId},receiver_account_id.eq.${accountId}`)
    .order('created_at', { ascending: false });

  if (accountError || !account) {
    console.error('Error fetching account details:', accountError);
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
};
