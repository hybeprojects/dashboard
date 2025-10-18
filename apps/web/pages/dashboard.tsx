import React, { useMemo } from 'react';
import Link from 'next/link';
import Card from '../components/ui/Card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../state/useAuthStore';
import { createClient } from '../lib/supabase/client';

function Icon({ d, className = '' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

const icons = {
  menu: 'M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z',
  inbox: 'M20 4H4a2 2 0 00-2 2v7h5l2 3h6l2-3h5V6a2 2 0 00-2-2z',
  products: 'M4 8l8-4 8 4-8 4-8-4zm0 4l8 4 8-4M4 16l8 4 8-4',
  power: 'M12 2v10m5.657-7.657a8 8 0 11-11.314 0',
  search: 'M11 4a7 7 0 105.293 12.293l3.707 3.707 1.414-1.414-3.707-3.707A7 7 0 0011 4z',
  chevronR: 'M9 18l6-6-6-6',
  radio: 'M12 4a8 8 0 100 16 8 8 0 000-16zm0 4a4 4 0 110 8 4 4 0 010-8z',
  eye: 'M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 10a3 3 0 110-6 3 3 0 010 6z',
  arrows: 'M7 7h10l-3-3m3 3l-3 3M17 17H7l3 3m-3-3l3-3',
  bill: 'M6 2h12v20l-6-3-6 3V2z',
  camera: 'M4 7h3l2-2h6l2 2h3v12H4V7z',
  chart: 'M5 19h14M7 17V9m5 8V5m5 12v-6',
};

export default function Dashboard() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const supabase = createClient();

  const { data: accounts = [], isLoading: accLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*');
      return data;
    },
    staleTime: 30_000,
  });
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('*');
      return data;
    },
    staleTime: 15_000,
  });
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase.from('notifications').select('*');
      return data;
    },
    staleTime: 15_000,
  });

  const accountsArr = Array.isArray(accounts) ? accounts : [];
  const transactionsArr = Array.isArray(transactions) ? transactions : [];
  const notificationsArr = Array.isArray(notifications) ? notifications : [];

  const totalBalance = useMemo(() => {
    return accountsArr.reduce((sum: number, a: any) => {
      const bal = Number(a.balance);
      return sum + (isNaN(bal) ? 0 : bal);
    }, 0);
  }, [accountsArr]);

  const primary = 'bg-primary text-white';

  return (
    <div className="container-page">
      {/* Mobile banking template */}
      <div className="md:hidden min-h-screen pb-20">
        <header className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-1 text-sm" aria-label="Menu">
              <Icon d={icons.menu} />
              <span>Menu</span>
            </button>
            <div className="text-sm text-gray-500">Dashboard</div>
            <div className="flex items-center gap-4">
              <button aria-label="Inbox" className="text-gray-600 dark:text-gray-300">
                <Icon d={icons.inbox} />
              </button>
              <button aria-label="Products" className="text-gray-600 dark:text-gray-300">
                <Icon d={icons.products} />
              </button>
              <button aria-label="Log out" className="text-gray-600 dark:text-gray-300">
                <Icon d={icons.power} />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-6 border-b border-gray-200 dark:border-gray-800 text-sm">
            <button className="-mb-px pb-2 border-b-2 border-red-600 font-medium">Accounts</button>
            <button className="pb-2 text-gray-500">Dashboard</button>
          </div>
          <div className="mt-3">
            <label className="relative block">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <Icon d={icons.search} />
              </span>
              <input
                className="w-full rounded-full bg-gray-100 dark:bg-gray-800 pl-10 pr-4 py-2 text-sm outline-none"
                placeholder="How can we help?"
                aria-label="Search"
              />
            </label>
          </div>
        </header>

        <main className="px-4 py-4 space-y-3">
          <Card className="p-0">
            <button className="w-full flex items-center justify-between px-4 py-4">
              <div className="text-left">
                <div className="text-sm text-gray-500">
                  Hello{user?.firstName ? ',' : ''} {user?.firstName || 'there'}
                </div>
              </div>
              <Icon d={icons.chevronR} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <Icon d={icons.radio} className="text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">PremierBank Life Plan</div>
                  <div className="text-xs text-gray-500">
                    Set and track goals with personalized guidance
                  </div>
                </div>
              </div>
              <Icon d={icons.chevronR} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-left">My Rewards</div>
              <Icon d={icons.chevronR} className="text-gray-400" />
            </button>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-4 pt-3 pb-2 text-white bg-primary">
              <div className="font-semibold">PremierBank</div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(accLoading ? [undefined, undefined] : accountsArr.slice(0, 2)).map(
                (acct: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm text-gray-500">
                        {acct?.name || acct?.accountName || `Account ${i + 1}`}{' '}
                        {acct?.number ? `- ${String(acct.number).slice(-4)}` : ''}
                      </div>
                      <div className="text-2xl font-bold">
                        {accLoading ? (
                          <span className="inline-block h-6 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        ) : (
                          `$${Number(acct?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/accounts/${acct ? (acct.id ?? acct.accountId ?? acct.number ?? i) : i}`}
                      className="text-blue-700 font-semibold text-sm"
                    >
                      VIEW
                    </Link>
                  </div>
                ),
              )}
            </div>
            <div className="px-4 py-3">
              <Link href="/open-account" className="text-blue-700 font-semibold text-sm">
                OPEN NEW ACCOUNT
              </Link>
            </div>
          </Card>

          <button className={`${primary} w-full rounded-xl px-4 py-4 text-center font-semibold`}>
            Open a savings account
          </button>
        </main>

        <nav className="fixed bottom-0 inset-x-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <ul className="grid grid-cols-5 text-xs">
            <li className="flex flex-col items-center py-2 text-primary">
              <Link href="/accounts" className="flex flex-col items-center">
                <Icon d={icons.eye} />
                <span>Accounts</span>
              </Link>
            </li>
            <li className="flex flex-col items-center py-2 text-gray-500">
              <Link href="/transfer" className="flex flex-col items-center">
                <Icon d={icons.arrows} />
                <span>Transfer</span>
              </Link>
            </li>
            <li className="flex flex-col items-center py-2 text-gray-500">
              <Link href="/bill-pay" className="flex flex-col items-center">
                <Icon d={icons.bill} />
                <span>Bill Pay</span>
              </Link>
            </li>
            <li className="flex flex-col items-center py-2 text-gray-500">
              <Link href="/deposit" className="flex flex-col items-center">
                <Icon d={icons.camera} />
                <span>Deposit</span>
              </Link>
            </li>
            <li className="flex flex-col items-center py-2 text-gray-500">
              <Link href="/invest" className="flex flex-col items-center">
                <Icon d={icons.chart} />
                <span>Invest</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
