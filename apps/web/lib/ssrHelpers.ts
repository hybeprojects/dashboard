import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { Session, User } from '@supabase/supabase-js';

import { createServerSupabaseClient as createClient } from './supabase/server';

type GetServerSidePropsCallback = (
  context: GetServerSidePropsContext,
  session: Session
) => Promise<GetServerSidePropsResult<{ [key: string]: any }>>;

export const withAuth = (getServerSidePropsFn?: GetServerSidePropsCallback) => {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<{ user: User } | { [key: string]: any }>> => {
    const supabase = createClient(context);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    if (getServerSidePropsFn) {
      return getServerSidePropsFn(context, session);
    }

    return {
      props: {
        user: session.user,
      },
    };
  };
};
