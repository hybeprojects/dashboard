import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import AccountCard from '../components/AccountCard';
import Card from '../components/ui/Card';
import useRequireAuth from '../hooks/useRequireAuth';
import cookie from 'cookie';

type AccountRow = any;

export default function AccountsPage() {
  // client-side guard
  useRequireAuth();
  const { data: accounts = [], isLoading } = useQuery<AccountRow[]>({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const res = await fetch('/api/banking?type=accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const json = await res.json();
      return json.accounts ?? json;
    },
    staleTime: 30_000,
  });
  return (
    <div className="container-page p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <Link href="/" className="text-sm text-gray-500">
          Back
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <AccountCard key={i} loading />)
        ) : accounts && accounts.length > 0 ? (
          accounts.map((a) => <AccountCard key={a.id} account={a} />)
        ) : (
          <div className="text-sm text-gray-500">No accounts found</div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/register" className="btn-primary block text-center rounded-xl py-3">
          Open New Account
        </Link>
      </div>
    </div>
  );
}

// Server-side auth guard
export async function getServerSideProps(context: any) {
  const cookiesHeader = context.req.headers.cookie || '';
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

  return { props: {} };
}
