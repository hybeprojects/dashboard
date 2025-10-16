import { withSessionSsr } from '../../../lib/session';
import { prisma, Account, Transaction } from '@premium-banking/db';

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

export const getServerSideProps = withSessionSsr(async function ({ req, params }) {
  const user = req.session.user;

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const accountId = params?.accountId as string;

  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: user.id, // Security check
    },
    include: {
      transactions: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!account) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      account: JSON.parse(JSON.stringify(account)),
    },
  };
});