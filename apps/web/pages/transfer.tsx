import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import { createClient } from '../lib/supabase/client';
import type { Database } from '../lib/supabase/types.gen';
import useRequireAuth from '../hooks/useRequireAuth';
import cookie from 'cookie';
import React, { useState } from 'react';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export default function TransferPage() {
  // client-side guard
  useRequireAuth();
  const qc = useQueryClient();
  const supabase = createClient();

  const { data: accounts = [] } = useQuery<AccountRow[]>({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const { data } = await supabase.from('accounts').select('*');
      return data ?? [];
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
      const fromAccountRec = accounts.find((a) => String(a.id) === String(from));
      const toAccountRec = accounts.find((a) => String(a.id) === String(to));
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

      const { error } = await (supabase as any).from('transactions').insert([payload as any]);

      if (error) {
        throw error;
      }

      qc.invalidateQueries({ queryKey: ['transactions'] });
      setSuccess('Transfer submitted');
      setAmount('');
      setTo('');
    } catch (err: any) {
      setError('Failed to submit transfer');
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
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded p-2"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} • ${Number(a.balance ?? 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600">To (account id)</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}

          <div>
            <button disabled={loading} className="w-full bg-blue-600 text-white rounded py-2">
              {loading ? 'Sending…' : 'Send Transfer'}
            </button>
          </div>
        </form>
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
