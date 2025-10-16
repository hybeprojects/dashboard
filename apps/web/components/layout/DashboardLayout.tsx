import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'O' },
  { href: '/accounts', label: 'Accounts', icon: 'A' },
  { href: '/transfers', label: 'Transfers', icon: 'T' },
  { href: '/profile', label: 'Profile', icon: 'P' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex items-center justify-center h-16 bg-white dark:bg-gray-800">
            <span className="text-2xl font-bold">BankLogo</span>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 bg-white dark:bg-gray-800">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  router.pathname === item.href
                    ? 'text-white bg-primary-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Header */}
        <header className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              {/* Mobile menu button can be added here */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <span className="mr-3">User Name</span>
              <button className="btn-secondary">Logout</button>
            </div>
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 shadow-t">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs ${
                router.pathname === item.href
                  ? 'text-primary-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}