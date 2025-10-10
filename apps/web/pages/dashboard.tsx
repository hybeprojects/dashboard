import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import OverviewChart from '../components/charts/OverviewChart';
import DonutChart from '../components/charts/DonutChart';

const area = Array.from({ length: 12 }, (_, i) => ({
  name: `M${i + 1}`,
  value: Math.round(Math.random() * 1000),
}));
const donut = [
  { name: 'Payments', value: 400 },
  { name: 'Transfers', value: 300 },
  { name: 'Cards', value: 200 },
  { name: 'Other', value: 100 },
];

import { useEffect, useMemo, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import OverviewChart from '../components/charts/OverviewChart';
import DonutChart from '../components/charts/DonutChart';
import api from '../lib/api';
import AccountCard from '../components/AccountCard';
import useWebSocket from '../hooks/useWebSocket';

const area = Array.from({ length: 12 }, (_, i) => ({
  name: `M${i + 1}`,
  value: Math.round(Math.random() * 1000),
}));
const donut = [
  { name: 'Payments', value: 400 },
  { name: 'Transfers', value: 300 },
  { name: 'Cards', value: 200 },
  { name: 'Other', value: 100 },
];

export default function Dashboard() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/api/accounts');
      setAccounts(res.data.accounts || []);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/api/transactions');
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, [fetchAccounts, fetchTransactions]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => {
      const v = Number(a?.raw?.accountBalance?.amount ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }, [accounts]);

  useWebSocket((event, payload) => {
    if (event === 'transfer') {
      setTransactions((t) => [payload, ...t]);
      // Simple notification
      setNotifications((n) => [
        { id: `n_${Date.now()}`, message: `Transfer of $${payload.amount}`, read: false },
        ...n,
      ]);
    }
    if (event === 'notification') {
      setNotifications((n) => [payload, ...n]);
    }
  });

  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <div className="text-sm text-gray-500">Total Balance</div>
              <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Accounts</div>
              <div className="text-2xl font-bold">{accounts.length}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Recent Transactions</div>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Card>
                <h3 className="text-lg font-semibold mb-4">Accounts</h3>
                <div className="space-y-3">
                  {accounts.length ? (
                    accounts.map((acct) => <AccountCard key={acct.id} account={acct} />)
                  ) : (
                    <div className="text-sm text-gray-500">No accounts yet</div>
                  )}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-2">
                  {transactions.length ? (
                    transactions.slice(0, 6).map((tx) => (
                      <div key={tx.id} className="flex justify-between">
                        <div className="text-sm">
                          {tx.fromAccountId} → {tx.toAccountId}
                        </div>
                        <div className="font-medium">${tx.amount}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No transactions</div>
                  )}
                </div>
              </Card>
            </div>
            <div>
              <Card>
                <h3 className="text-lg font-semibold mb-4">Cashflow</h3>
                <OverviewChart data={area} />
              </Card>
              <Card>
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                <div className="space-y-2">
                  {notifications.length ? (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 rounded ${n.read ? 'bg-gray-100' : 'bg-green-50'}`}
                      >
                        {n.message || JSON.stringify(n)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No notifications</div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Spending breakdown</h3>
            <DonutChart data={donut} />
          </Card>
        </main>
      </div>
    </div>
  );
}
