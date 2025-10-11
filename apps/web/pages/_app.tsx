import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import * as Sentry from '@sentry/react';
import { AppQueryProvider } from '../lib/query';
import TopProgressBar from '../components/ui/TopProgressBar';
import useCurrentUser from '../hooks/useCurrentUser';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
}

function AppInner({
  Component,
  pageProps,
}: {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}) {
  useCurrentUser();
  return <Component {...pageProps} />;
}

import NextApp from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppQueryProvider>
        <TopProgressBar />
        <AppInner Component={Component} pageProps={pageProps} />
      </AppQueryProvider>
    </ThemeProvider>
  );
}

MyApp.getInitialProps = async (appContext: any) => {
  const appProps = await NextApp.getInitialProps(appContext);
  return { ...appProps };
};

export default MyApp;
