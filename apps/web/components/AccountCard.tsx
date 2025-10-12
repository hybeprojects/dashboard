import React from 'react';

export default function AccountCard({ account }: { account: any }) {
  const rawBal = (account && (account.balance ?? account?.raw?.accountBalance?.amount)) ?? '0';
  const balance = `$${Number(rawBal).toFixed(2)}`;
  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{account?.type || 'Account'}</div>
          <div className="text-lg font-bold">{balance}</div>
        </div>
        <div className="text-xs text-gray-400">Acct #{account?.id}</div>
      </div>
    </div>
  );
}
