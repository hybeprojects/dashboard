// apps/web/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type GetServerSidePropsContext } from 'next';

export const createServerSupabaseClient = (context: GetServerSidePropsContext) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader('set-cookie', `${name}=${value}; SameSite=Lax; HttpOnly`);
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader('set-cookie', `${name}=; Max-Age=0; SameSite=Lax; HttpOnly`);
        },
      },
    }
  );
};
