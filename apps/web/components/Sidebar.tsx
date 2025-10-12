import Link from 'next/link';

export default function Sidebar() {
  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/accounts', label: 'Accounts' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/payments', label: 'Payments' },
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
  ];
  return (
    <aside className="sidebar" aria-label="Primary">
      <nav className="flex flex-col gap-1">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
