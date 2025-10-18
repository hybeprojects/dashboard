import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ThemeToggle from '../lib/theme';
import { useState } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { createClient } from '../lib/supabase/client';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    logout();
    setOpen(false);
  }

  return (
    <motion.nav className="navbar" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <div className="section flex h-20 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-primary">
          <img
            src="https://res.cloudinary.com/dgqhyz67g/image/upload/Cleaned-logo-Premier-bank_flnsfz.png"
            alt="PremierBank"
            className="h-20 w-auto object-contain"
          />
        </Link>
        <div className="hidden items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm">
                {user.user_metadata.first_name || user.email}
              </Link>
              <button className="text-sm text-primary" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Open Account
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
        <button
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-5 bg-current transition-transform ${open ? 'translate-y-1.5 rotate-45' : ''}`}
            ></span>
            <span className={`block h-0.5 w-5 bg-current ${open ? 'opacity-0' : ''}`}></span>
            <span
              className={`block h-0.5 w-5 bg-current transition-transform ${open ? '-translate-y-1.5 -rotate-45' : ''}`}
            ></span>
          </div>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-gray-200 dark:border-gray-800"
          >
            <div className="section py-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="py-2" onClick={() => setOpen(false)}>
                    {user.user_metadata.first_name || user.email}
                  </Link>
                  <button className="text-left text-primary" onClick={handleSignOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="py-2" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-center"
                    onClick={() => setOpen(false)}
                  >
                    Open Account
                  </Link>
                </>
              )}
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
