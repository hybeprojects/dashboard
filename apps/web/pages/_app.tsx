import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import * as Sentry from '@sentry/react';
import { AppQueryProvider } from '../lib/query';
import TopProgressBar from '../components/ui/TopProgressBar';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

import DashboardLayout from '../components/layout/DashboardLayout';
import { useRouter } from 'next/router';
import React from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboardPage = router.pathname.startsWith('/dashboard') || ['/accounts', '/transfers', '/profile'].includes(router.pathname);

  const Layout = isDashboardPage ? DashboardLayout : React.Fragment;

  return (
    <Suspense fallback={<TopProgressBar />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppQueryProvider>
            <TopProgressBar />
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </AppQueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>
  );
}

export default MyApp;
