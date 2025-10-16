import { withSessionSsr } from '../../../lib/session';
import { prisma, Account } from '@premium-banking/db';
import Link from 'next/link';

type AccountsPageProps = {
  accounts: Account[];
};

const maskAccountNumber = (accountNumber: string) => {
  return `•••• ${accountNumber.slice(-4)}`;
};

export default function AccountsPage({ accounts }: AccountsPageProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Accounts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold capitalize">{account.type} Account</h2>
              <p className="text-gray-500 dark:text-gray-400 font-mono">{maskAccountNumber(account.accountNumber)}</p>
              <p className="text-2xl font-bold mt-4">${account.balance.toFixed(2)}</p>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Quick Actions</h3>
              <div className="mt-2 flex space-x-2">
                <Link href={`/dashboard/accounts/${account.id}`} className="btn-primary-sm">
                  View
                </Link>
                <button className="btn-secondary-sm">Transfer</button>
                <button className="btn-secondary-sm">Deposit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps = withSessionSsr(async function ({ req }) {
  const user = req.session.user;

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
  });

  return {
    props: {
      accounts: JSON.parse(JSON.stringify(accounts)),
    },
  };
});