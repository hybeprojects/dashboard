import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Landing() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16">
        <motion.h1 className="text-4xl sm:text-5xl font-extrabold mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>Banking for the modern world</motion.h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">Secure accounts, seamless payments, instant insights. Designed for reliability and speed.</p>
        <div className="mt-8 flex gap-4">
          <Link href="/register" className="btn-primary">Get Started</Link>
          <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">Sign In</Link>
        </div>
      </main>
    </div>
  );
}
