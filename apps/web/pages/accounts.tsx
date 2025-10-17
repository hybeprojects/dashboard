import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import { createClient } from '../lib/supabase/client';

export default function AccountsPage() {
  const supabase = createClient();
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*');
      return data;
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
          accounts.map((a: any) => (
            <Card key={a.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {a.name || a.accountName || 'Account'}
                  </div>
                  <div className="font-medium">
                    ${Number(a.balance ?? a.raw?.accountBalance?.amount ?? 0).toLocaleString()}
                  </div>
                </div>
                <Link
                  href={`/accounts/${a.id ?? a.accountId ?? a.number ?? '0'}`}
                  className="text-blue-600 text-sm font-semibold"
                >
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
        <Link
          href="/open-account"
          className="block text-center bg-red-600 text-white rounded-xl py-3"
        >
          Open New Account
        </Link>
      </div>
    </div>
  );
}
