import Link from 'next/link';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ThemeToggle from '../lib/theme';

export default function Navbar() {
  return (
    <motion.nav className="navbar" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <div className="section flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-primary">PremierBank</Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm">Login</Link>
          <Link href="/register" className="btn-primary text-sm">Open Account</Link>
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}
