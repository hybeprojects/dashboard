import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../lib/theme';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <motion.nav className="navbar" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <div className="section flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-primary">
          PremierBank
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm">
            Login
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Open Account
          </Link>
          <ThemeToggle />
        </div>
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800"
          aria-label="Open menu"
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
            className="md:hidden border-t border-gray-200 dark:border-gray-800"
          >
            <div className="section py-4 flex flex-col gap-3">
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
