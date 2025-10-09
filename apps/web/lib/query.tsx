import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import getSupabase from './supabase';

const client = new QueryClient();

export function AppQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function subscribeToUser(userId: string, onChange: (payload: any) => void) {
  const supabase = getSupabase();
  if (!supabase) return { unsubscribe: () => {} } as any;

  return supabase
    .channel('public:accounts')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
      (payload) => onChange(payload),
    )
    .subscribe();
}
