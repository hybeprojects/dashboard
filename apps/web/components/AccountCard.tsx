import React from 'react';
import Link from 'next/link';

export default function AccountCard({ account, loading }: { account?: any; loading?: boolean }) {
  if (loading) {
    return (
      <div className="card-surface p-4 animate-pulse" aria-busy>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24" />
      </div>
    );
  }

  const rawBal = (account && (account.balance ?? account?.raw?.accountBalance?.amount)) ?? 0;
  const balance = `$${Number(rawBal).toFixed(2)}`;
  const accountId = account?.id;

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{account?.type || 'Account'}</div>
          <div className="text-lg font-bold" aria-label={`Balance ${balance}`}>
            {balance}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {accountId ? (
            <Link href={`/dashboard/accounts/${accountId}`} className="hover:underline" aria-label={`View account ${accountId}`}>
              Acct #{String(accountId)}
            </Link>
          ) : (
            'Acct #—'
          )}
        </div>
      </div>
    </div>
  );
}
