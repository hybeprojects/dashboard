import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getUserFromRequest } from './serverAuth';

type GetServerSidePropsCallback = (
  context: GetServerSidePropsContext,
  user: any,
) => Promise<GetServerSidePropsResult<{ [key: string]: any }>>;

export const withAuth = (getServerSidePropsFn?: GetServerSidePropsCallback) => {
  return async (
    context: GetServerSidePropsContext,
  ): Promise<GetServerSidePropsResult<{ user: any } | { [key: string]: any }>> => {
    const user = await getUserFromRequest(context.req as any);

    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    if (getServerSidePropsFn) {
      return getServerSidePropsFn(context, user);
    }

    return {
      props: {
        user,
      },
    };
  };
};
