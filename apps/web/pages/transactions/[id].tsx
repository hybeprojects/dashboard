import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import useRequireAuth from '../../hooks/useRequireAuth';
import { withAuth } from '../../lib/ssrHelpers';

export default function TransactionDetail() {
  // client-side guard
  useRequireAuth();
  const router = useRouter();
  const { id } = router.query;

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });

  const tx = (transactions || []).find((t: any) => String(t.id) === String(id));

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
        <div className="text-2xl font-bold my-2">{`$${Number(tx.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
        <div className="text-sm text-gray-500">From: {tx.sender_account_id || tx.account_id}</div>
        <div className="text-sm text-gray-500">To: {tx.receiver_account_id || '—'}</div>
        {tx.created_at && (
          <div className="text-xs text-gray-400 mt-2">
            {new Date(tx.created_at).toLocaleString()}
          </div>
        )}
      </Card>
    </div>
  );
}

// Server-side auth guard
export const getServerSideProps = withAuth();
