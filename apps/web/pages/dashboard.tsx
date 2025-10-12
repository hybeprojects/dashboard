import React, { useMemo } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import OverviewChart from '../components/charts/OverviewChart';
import DonutChart from '../components/charts/DonutChart';
import api from '../lib/api';
import AccountCard from '../components/AccountCard';
import useWebSocket from '../hooks/useWebSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const area = Array.from({ length: 12 }, (_, i) => ({ name: `M${i + 1}`, value: Math.round(Math.random() * 1000) }));
const donut = [
  { name: 'Payments', value: 400 },
  { name: 'Transfers', value: 300 },
  { name: 'Cards', value: 200 },
  { name: 'Other', value: 100 },
];

async function fetchAccounts() {
  const res = await api.get('/accounts');
  return res.data?.accounts || res.data || [];
}
async function fetchTransactions() {
  const res = await api.get('/transactions');
  return res.data?.transactions || res.data || [];
}
async function fetchNotifications() {
  const res = await api.get('/notifications');
  return res.data?.notifications || res.data || [];
}

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: accounts = [], isLoading: accLoading } = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts, staleTime: 30_000 });
  const { data: transactions = [], isLoading: txLoading } = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions, staleTime: 15_000 });
  const { data: notifications = [], isLoading: notifLoading } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, staleTime: 15_000 });

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum: number, a: any) => {
      const rawAmt = Number(a?.raw?.accountBalance?.amount ?? 0);
      const bal = Number(a.balance ?? rawAmt);
      return sum + (isNaN(bal) ? 0 : bal);
    }, 0);
  }, [accounts]);

  useWebSocket((event, payload) => {
    if (event === 'transfer') {
      qc.setQueryData<any[]>(['transactions'], (prev = []) => [{ ...payload }, ...prev]);
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.setQueryData<any[]>(['notifications'], (prev = []) => [
        { id: `n_${Date.now()}`, message: `Transfer of $${payload.amount}`, read: false },
        ...prev,
      ]);
    }
    if (event === 'notification') {
      qc.setQueryData<any[]>(['notifications'], (prev = []) => [payload, ...prev]);
    }
  });

  const statVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6" aria-labelledby="dashboard-heading">
          <h1 id="dashboard-heading" className="sr-only">Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[{ label: 'Total Balance', value: `$${totalBalance.toFixed(2)}`, loading: accLoading }, { label: 'Accounts', value: accounts.length, loading: accLoading }, { label: 'Recent Transactions', value: transactions.length, loading: txLoading }].map((s, i) => (
              <motion.div key={i} initial="hidden" animate="show" transition={{ delay: i * 0.05 }} variants={statVariants}>
                <Card aria-live="polite" aria-busy={s.loading}>
                  <div className="text-sm text-gray-500">{s.label}</div>
                  <div className="text-2xl font-bold">
                    {s.loading ? <span className="inline-block h-6 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" /> : s.value}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card>
                <h2 className="text-lg font-semibold mb-4">Accounts</h2>
                <div className="space-y-3">
                  {accLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))
                  ) : accounts.length ? (
                    accounts.map((acct: any) => (
                      <motion.div key={acct.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                        <AccountCard account={acct} />
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No accounts yet</div>
                  )}
                </div>
              </Card>
              <Card>
                <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
                <div className="space-y-2">
                  {txLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))
                  ) : transactions.length ? (
                    transactions.slice(0, 6).map((tx: any) => (
                      <motion.div key={tx.id ?? `${tx.fromAccountId}-${tx.toAccountId}-${tx.amount}-${tx.createdAt ?? i}` } className="flex justify-between" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="text-sm">
                          {tx.fromAccountId || tx.account_id || tx.accountId || '—'} → {tx.toAccountId || tx.recipient_account || '—'}
                        </div>
                        <div className="font-medium">${tx.amount}</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No transactions</div>
                  )}
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <h2 className="text-lg font-semibold mb-4">Cashflow</h2>
                <OverviewChart data={area} />
              </Card>
              <Card>
                <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                <div className="space-y-2" role="region" aria-live="polite">
                  {notifLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))
                  ) : notifications.length ? (
                    notifications.slice(0, 8).map((n: any) => (
                      <motion.div key={n.id} className={`p-2 rounded ${n.read || n.is_read ? 'bg-gray-100 dark:bg-gray-800/60' : 'bg-green-50 dark:bg-green-900/30'}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                        {n.message || JSON.stringify(n)}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No notifications</div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Spending breakdown</h2>
            <DonutChart data={donut} />
          </Card>
        </main>
      </div>
    </div>
  );
}
