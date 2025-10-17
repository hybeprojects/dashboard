import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import { createClient } from '../../lib/supabase/client';

export default function AccountDetail() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = createClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*');
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('*');
      return data;
    },
  });

  const acct = accounts?.find(
    (a: any) =>
      String(a.id) === String(id) ||
      String(a.accountId) === String(id) ||
      String(a.number) === String(id),
  );
  const relatedTx = transactions?.filter(
    (t: any) =>
      String(t.fromAccountId) === String(id) ||
      String(t.toAccountId) === String(id) ||
      String(t.account_id) === String(id),
  );

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
          <div className="text-sm text-gray-500">
            {acct?.name || acct?.accountName || 'Account'}
          </div>
          <div className="text-2xl font-bold">
            ${Number(acct?.balance ?? acct?.raw?.accountBalance?.amount ?? 0).toLocaleString()}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Recent activity</h3>
          {relatedTx && relatedTx.length > 0 ? (
            relatedTx.slice(0, 8).map((t: any) => (
              <div key={t.id || JSON.stringify(t)} className="flex justify-between py-2 border-t">
                <div className="text-sm">
                  {t.description || `${t.fromAccountId} → ${t.toAccountId}`}
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
