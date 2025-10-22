// apps/web/pages/dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../state/useAuthStore';
import { createClient } from '../lib/supabase/client';
import { createServerSupabaseClient } from '../lib/supabase/server';
import type { Database } from '../lib/supabase/types.gen';
import { type GetServerSidePropsContext } from 'next';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];

function Icon({ d, className = '' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createServerSupabaseClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};

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
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const supabase = createClient();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data?.user || null;
        if (mounted) {
          setUser(
            u
              ? {
                  id: u.id,
                  email: u.email || '',
                  firstName: u.user_metadata?.first_name,
                  lastName: u.user_metadata?.last_name,
                }
              : null,
          );
        }
        if (!u && mounted) {
          // Not authenticated -> redirect to login
          router.replace('/login');
        }
      } catch (e) {
        // ignore and redirect
        if (mounted) router.replace('/login');
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, setUser, supabase]);

  const { data: accounts = [], isLoading: accLoading } = useQuery<AccountRow[]>({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountRow[]> => {
      const { data } = await supabase.from('accounts').select('*');
      return data ?? [];
    },
    staleTime: 30_000,
  });
  const { data: transactions = [], isLoading: txLoading } = useQuery<TransactionRow[]>({
    queryKey: ['transactions'],
    queryFn: async (): Promise<TransactionRow[]> => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    staleTime: 15_000,
  });
  const { data: notifications = [], isLoading: notifLoading } = useQuery<unknown[]>({
    queryKey: ['notifications'],
    queryFn: async (): Promise<unknown[]> => {
      const { data } = await (supabase as any).from('notifications').select('*');
      return (data as unknown[]) ?? [];
    },
    staleTime: 15_000,
  });

  // realtime subscriptions to keep balances and transactions up-to-date
  useEffect(() => {
    if (!supabase) return;
    const acctChannel = supabase
      .channel('public:accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, (payload) => {
        qc.setQueryData(['accounts'], (old: any) => {
          const list = Array.isArray(old) ? [...old] : [];
          const newRow = payload.new;
          if (!newRow) return list;
          const idx = list.findIndex(
            (a: any) => a.id === (newRow as any).id || a.accountId === (newRow as any).accountId,
          );
          if (idx === -1) list.unshift(newRow);
          else list[idx] = { ...list[idx], ...newRow };
          return list;
        });
      })
      .subscribe();

    const txChannel = supabase
      .channel('public:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          qc.setQueryData(['transactions'], (old: any) => {
            const list = Array.isArray(old) ? [...old] : [];
            const newRow = payload.new;
            if (!newRow) return list;
            // for inserts, add to top; for updates, replace
            const idx = list.findIndex(
              (t: any) =>
                t.id === (newRow as any).id || t.transactionId === (newRow as any).transactionId,
            );
            if (idx === -1) list.unshift(newRow);
            else list[idx] = { ...list[idx], ...newRow };
            return list;
          });
        },
      )
      .subscribe();

    return () => {
      try {
        acctChannel.unsubscribe();
      } catch (e) {
        // ignore
      }
      try {
        txChannel.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [qc, supabase]);

  const accountsArr = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts]);
  const transactionsArr = Array.isArray(transactions) ? transactions : [];
  const notificationsArr = Array.isArray(notifications) ? notifications : [];

  const totalBalance = useMemo(() => {
    return accountsArr.reduce((sum: number, a: any) => {
      const bal = Number(a.balance);
      return sum + (isNaN(bal) ? 0 : bal);
    }, 0);
  }, [accountsArr]);

  const primary = 'bg-primary text-white';

  if (checkingAuth) {
    return (
      <div className="container-page">
        <main className="section py-10 max-w-3xl mx-auto">
          <div className="card-surface p-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4 animate-pulse" />
            <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2 animate-pulse" />
            <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2 animate-pulse" />
            <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mt-4 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container-page">
      {/* Mobile banking template */}
      <div className="md:hidden min-h-screen pb-20">
        <header className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <Button variant="secondary" className="flex items-center gap-2 text-sm" aria-label="Menu">
              <Icon d={icons.menu} />
              <span>Menu</span>
            </Button>
            <div className="text-sm text-gray-500">Dashboard</div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" aria-label="Inbox" className="h-10 w-10 p-0 flex items-center justify-center">
                <Icon d={icons.inbox} />
              </Button>
              <Button variant="secondary" aria-label="Products" className="h-10 w-10 p-0 flex items-center justify-center">
                <Icon d={icons.products} />
              </Button>
              <Button variant="secondary" aria-label="Log out" className="h-10 w-10 p-0 flex items-center justify-center">
                <Icon d={icons.power} />
              </Button>
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
                className="input-field rounded-full pl-10 pr-4 text-sm"
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
                        {acct?.name || acct?.accountName || `Account ${i + 1}`}
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
