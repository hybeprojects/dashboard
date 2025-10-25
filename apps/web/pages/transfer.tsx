import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useRequireAuth from '../hooks/useRequireAuth';
import cookie from 'cookie';
import React, { useState } from 'react';

type AccountRow = any;

type TransactionInsert = any;

export default function TransferPage() {
  // client-side guard
  useRequireAuth();
  const qc = useQueryClient();

  const { data: accounts = [] } = useQuery<AccountRow[]>({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const res = await fetch('/api/banking?type=accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const json = await res.json();
      return json.accounts ?? json;
    },
  });

  const [from, setFrom] = useState(accounts?.[0]?.id ?? '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (!from && accounts && accounts.length > 0) setFrom(accounts[0].id ?? '');
  }, [accounts, from]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const fromAccountRec = accounts.find((a: any) => String(a.id) === String(from));
      const toAccountRec = accounts.find((a: any) => String(a.id) === String(to));
      const fromBalance = Number(fromAccountRec?.balance ?? 0);
      const amt = parseFloat(amount);
      if (!isFinite(amt) || amt <= 0) {
        throw new Error('Invalid amount');
      }
      const newBalance = fromBalance - amt;
      const receiverName = toAccountRec?.name ?? String(to);
      const receiverEmail = null as string | null;

      const payload: TransactionInsert = {
        account_id: from,
        sender_account_id: from,
        receiver_account_id: to || null,
        receiver_name: receiverName || null,
        receiver_email: receiverEmail,
        amount: amt,
        type: 'transfer',
        status: 'completed',
        description: `Transfer to ${receiverName}`,
        running_balance: newBalance,
        reference: `TRF-${Date.now()}`,
      };

      const resp = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to submit transfer');
      }

      qc.invalidateQueries({ queryKey: ['transactions'] });
      setSuccess('Transfer submitted');
      setAmount('');
      setTo('');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit transfer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Transfer</h2>
        <Link href="/" className="text-sm text-gray-500">
          Back
        </Link>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600">From</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="input-field">
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name} • ${Number(a.balance ?? 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600">To (account id)</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send Transfer'}
            </Button>
          </div>
        </form>
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
