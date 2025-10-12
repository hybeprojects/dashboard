import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';

async function fetchTransactions() {
  try {
    const res = await api.get('/transactions');
    return Array.isArray(res.data) ? res.data : res.data?.transactions || [];
  } catch (e) {
    return [];
  }
}

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: transactions = [] } = useQuery(['transactions'], fetchTransactions);
  const tx = transactions.find((t: any) => String(t.id) === String(id));

  if (!tx) {
    return (
      <div className="container-page p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction</h2>
          <Link href="/" className="text-sm text-gray-500">Back</Link>
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
        <Link href="/transactions" className="text-sm text-gray-500">Back</Link>
      </div>
      <Card>
        <div className="text-sm text-gray-500">{tx.description || 'Transaction details'}</div>
        <div className="text-2xl font-bold my-2">${tx.amount}</div>
        <div className="text-sm text-gray-500">From: {tx.fromAccountId || tx.account_id}</div>
        <div className="text-sm text-gray-500">To: {tx.toAccountId || tx.recipient_account}</div>
        <div className="text-xs text-gray-400 mt-2">{tx.createdAt}</div>
      </Card>
    </div>
  );
}
