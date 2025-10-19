import { createServerClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types.gen';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component context: ignore; middleware may refresh sessions.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component context: ignore; middleware may refresh sessions.
          }
        },
      },
    },
  );
};
