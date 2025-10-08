import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle color scheme">
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
