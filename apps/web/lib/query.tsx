import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import getSupabase from './supabase';

const client = new QueryClient();

export function AppQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function subscribeToUser(userId: string, onChange: (payload: any) => void) {
  // Using socket.io for realtime. Supabase realtime subscriptions disabled to prevent conflicts in this demo.
  return { unsubscribe: () => {} } as any;
}
