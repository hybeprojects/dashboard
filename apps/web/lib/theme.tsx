import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid rendering interactive theme UI until after hydration to prevent
  // server/client content mismatches and runtime errors when window is not available.
  if (!mounted) {
    return (
      <button
        aria-hidden
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 opacity-0 pointer-events-none"
      />
    );
  }

  const systemPrefersDark =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  return (
    <button
      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle color scheme"
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
