import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import { createClient } from '../../lib/supabase/client';
import type { Database } from '../../lib/supabase/types.gen';
import useRequireAuth from '../../hooks/useRequireAuth';
import cookie from 'cookie';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export default function TransactionDetail() {
  // client-side guard
  useRequireAuth();
  const router = useRouter();
  const { id } = router.query;
  const supabase = createClient();

  const { data: transactions = [] } = useQuery<TransactionRow[]>({
    queryKey: ['transactions'],
    queryFn: async (): Promise<TransactionRow[]> => {
      const { data } = await supabase.from('transactions').select('*');
      return data ?? [];
    },
  });

  const tx = transactions.find((t) => String(t.id) === String(id));

  if (!tx) {
    return (
      <div className="container-page p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction</h2>
          <Link href="/" className="text-sm text-gray-500">
            Back
          </Link>
        </div>
        <Card>
          <div className="text-sm text-gray-500">Transaction not found</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Transaction</h2>
        <Link href="/transactions" className="text-sm text-gray-500">
          Back
        </Link>
      </div>
      <Card>
        <div className="text-sm text-gray-500">{tx.description || 'Transaction details'}</div>
        <div className="text-2xl font-bold my-2">${tx.amount}</div>
        <div className="text-sm text-gray-500">From: {tx.sender_account_id || tx.account_id}</div>
        <div className="text-sm text-gray-500">To: {tx.receiver_account_id}</div>
        <div className="text-xs text-gray-400 mt-2">{tx.created_at}</div>
      </Card>
    </div>
  );
}

// Server-side auth guard
export async function getServerSideProps(context: any) {
  const cookiesHeader = context.req.headers.cookie || '';
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

  return { props: {} };
}
