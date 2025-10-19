import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import { createClient } from '../lib/supabase/client';

export default function TransferPage() {
  const qc = useQueryClient();
  const supabase = createClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*');
      return data;
    },
  });

  const [from, setFrom] = useState(accounts?.[0]?.id ?? '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (!from && accounts && accounts.length > 0)
      setFrom(accounts[0].id ?? accounts[0].accountId ?? '');
  }, [accounts, from]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const fromAccountRec = accounts?.find(
        (a: any) => String(a.id ?? a.accountId ?? a.number) === String(from),
      );
      const toAccountRec = accounts?.find(
        (a: any) => String(a.id ?? a.accountId ?? a.number) === String(to),
      );
      const fromBalance = Number(
        fromAccountRec?.balance ?? fromAccountRec?.raw?.accountBalance?.amount ?? 0,
      );
      const amt = parseFloat(amount);
      if (!isFinite(amt) || amt <= 0) {
        throw new Error('Invalid amount');
      }
      const newBalance = fromBalance - amt;
      const receiverName = toAccountRec?.name || toAccountRec?.accountName || String(to);
      const receiverEmail =
        (toAccountRec as any)?.email || (toAccountRec as any)?.owner_email || null;

      const { data, error } = await supabase.from('transactions').insert([
        {
          sender_account_id: from,
          receiver_account_id: to,
          receiver_name: receiverName,
          receiver_email: receiverEmail,
          amount: amt,
          type: 'transfer',
          status: 'completed',
          description: `Transfer to ${receiverName}`,
          running_balance: newBalance,
          reference: `TRF-${Date.now()}`,
        },
      ]);

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
              {accounts?.map((a: any) => (
                <option
                  key={a.id ?? a.accountId ?? a.number}
                  value={a.id ?? a.accountId ?? a.number}
                >
                  {a.name || a.accountName} • $
                  {Number(a.balance ?? a.raw?.accountBalance?.amount ?? 0).toLocaleString()}
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
