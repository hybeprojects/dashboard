import { withSessionSsr } from '../../../lib/session';
import { prisma, Account } from '@premium-banking/db';
import Link from 'next/link';

type AccountsPageProps = {
  accounts: Account[];
};

export default function AccountsPage({ accounts }: AccountsPageProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Accounts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Link key={account.id} href={`/dashboard/accounts/${account.id}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold">{account.type}</h2>
              <p className="text-gray-500 dark:text-gray-400">{account.accountNumber}</p>
              <p className="text-2xl font-bold mt-4">${account.balance.toFixed(2)}</p>
            </div>
          </Link>
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