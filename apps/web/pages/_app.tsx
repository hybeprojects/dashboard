import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import * as Sentry from '@sentry/react';
import { AppQueryProvider } from '../lib/query';
import TopProgressBar from '../components/ui/TopProgressBar';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { useSupabaseSession } from '../hooks/useAuth';
import { useCsrfBootstrap } from '../hooks/useCsrf';

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

function MyApp({ Component, pageProps }: AppProps) {
  useSupabaseSession();
  useCsrfBootstrap();

  return (
    <Suspense fallback={<TopProgressBar />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppQueryProvider>
            <TopProgressBar />
            <Component {...pageProps} />
          </AppQueryProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>
  );
}

export default MyApp;
