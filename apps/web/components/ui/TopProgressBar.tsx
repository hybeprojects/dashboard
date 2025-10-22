import { useState, useEffect } from 'react';
import Router from 'next/router';

export default function TopProgressBar() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsActive(true);
    const handleDone = () => setIsActive(false);

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleDone);
    Router.events.on('routeChangeError', handleDone);
    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleDone);
      Router.events.off('routeChangeError', handleDone);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <svg className="w-14 h-14 animate-spin text-primary" viewBox="0 0 50 50" aria-hidden>
        <circle
          className="opacity-25"
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
        />
        <path
          className="opacity-100"
          fill="currentColor"
          d="M25 5a20 20 0 0114.142 34.142l-4.243-4.243A12 12 0 1037 17.757L25 5z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
