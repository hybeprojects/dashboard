import { useState, useEffect } from 'react';
import Router from 'next/router';

export default function TopProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: any;
    const start = () => {
      setIsActive(true);
      setProgress(10);
      clearInterval(timer);
      timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 10 : p));
      }, 200);
    };
    const done = () => {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setIsActive(false);
        setProgress(0);
      }, 200);
    };

    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', done);
    Router.events.on('routeChangeError', done);
    return () => {
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', done);
      Router.events.off('routeChangeError', done);
      clearInterval(timer);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-200"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    </div>
  );
}
