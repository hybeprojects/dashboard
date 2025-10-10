import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import * as Sentry from '@sentry/react';
import { AppQueryProvider } from '../lib/query';
import TopProgressBar from '../components/ui/TopProgressBar';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
}

function AppInner({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppQueryProvider>
        <TopProgressBar />
        <AppInner Component={Component} pageProps={pageProps} />
      </AppQueryProvider>
    </ThemeProvider>
  );
}
