import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import useRequireAuth from '../../hooks/useRequireAuth';
import cookie from 'cookie';

type AccountRow = any;
type TransactionRow = any;

export default function AccountDetail() {
  // client-side guard
  useRequireAuth();
  const router = useRouter();
  const { id } = router.query;

  const { data: accounts = [] } = useQuery<AccountRow[]>({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const res = await fetch('/api/banking?type=accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const json = await res.json();
      return json.accounts ?? json;
    },
  });

  const { data: transactions = [] } = useQuery<TransactionRow[]>({
    queryKey: ['transactions', id],
    queryFn: async (): Promise<TransactionRow[]> => {
      if (!id) return [];
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const json = await res.json();
      // filter locally by account id
      return (json || []).filter((t: any) => String(t.sender_account_id) === String(id) || String(t.receiver_account_id) === String(id));
    },
    enabled: !!id,
  });

  const acct = accounts.find((a: any) => String(a.id) === String(id));
  const relatedTx = transactions;

  return (
    <div className="container-page p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <Link href="/accounts" className="text-sm text-gray-500">
          Back
        </Link>
      </div>

      <Card>
        <div className="mb-3">
          <div className="text-sm text-gray-500">{acct?.name || 'Account'}</div>
          <div className="text-2xl font-bold">${Number(acct?.balance ?? 0).toLocaleString()}</div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Recent activity</h3>
          {relatedTx && relatedTx.length > 0 ? (
            relatedTx.slice(0, 8).map((t: any) => (
              <div key={t.id} className="flex justify-between py-2 border-t">
                <div className="text-sm">
                  {t.description || `${t.sender_account_id} → ${t.receiver_account_id}`}
                </div>
                <div className="font-medium">${t.amount}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No recent activity</div>
          )}
        </div>
      </Card>
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
