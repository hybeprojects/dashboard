import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import { createClient } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/types.gen';
import useRequireAuth from '../hooks/useRequireAuth';
import cookie from 'cookie';

type AccountRow = Database['public']['Tables']['accounts']['Row'];

export default function AccountsPage() {
  // client-side guard
  useRequireAuth();
  const supabase = createClient();
  const { data: accounts = [], isLoading } = useQuery<AccountRow[]>({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const { data } = await supabase.from('accounts').select('*');
      return data ?? [];
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
          <div className="text-sm text-gray-500">Loading…</div>
        ) : accounts && accounts.length > 0 ? (
          accounts.map((a) => (
            <Card key={a.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{a.name || 'Account'}</div>
                  <div className="font-medium">{`$${Number(a.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
                </div>
                <Link href={`/accounts/${a.id}`} className="text-primary text-sm font-semibold">
                  View
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-sm text-gray-500">No accounts found</div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/open-account" className="btn-primary block text-center rounded-xl py-3">
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
