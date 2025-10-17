import { createServerClient } from '@supabase/ssr';
import { GetServerSidePropsContext } from 'next';
import { Account, Transaction } from '../../../lib/supabase/types';
import { serialize } from 'cookie';

type AccountDetailsPageProps = {
  account: Account & { transactions: Transaction[] };
};

export default function AccountDetailsPage({ account }: AccountDetailsPageProps) {
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold capitalize">{account.type} Account</h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono">{account.accountNumber}</p>
        <p className="text-4xl font-bold mt-4">${account.balance.toFixed(2)}</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      <div className="space-y-4">
        {account.transactions.map((transaction) => (
          <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center">
            <div>
              <p className="font-bold">{transaction.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(transaction.createdAt).toLocaleDateString()}
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
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => context.req.cookies[name],
        set: (name, value, options) => {
          context.res.setHeader('Set-Cookie', serialize(name, value, options));
        },
        remove: (name, options) => {
          context.res.setHeader('Set-Cookie', serialize(name, '', options));
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const accountId = context.params?.accountId as string;

  const { data: account, error } = await supabase
    .from('accounts')
    .select('*, transactions(*)')
    .eq('id', accountId)
    .eq('user_id', session.user.id)
    .single();

  if (error || !account) {
    console.error('Error fetching account details:', error);
    return {
      notFound: true,
    };
  }

  return {
    props: {
      account,
    },
  };
};