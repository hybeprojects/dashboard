import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const client = new QueryClient();

export function AppQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function subscribeToUser(userId: string, onChange: (payload: any) => void) {
  // placeholder for real-time subscriptions (socket.io or supabase)
  return { unsubscribe: () => {} } as any;
}
