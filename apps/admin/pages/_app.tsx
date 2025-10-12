import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import TopProgressBar from '../components/ui/TopProgressBar';
import { AppQueryProvider } from '../lib/query';

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
