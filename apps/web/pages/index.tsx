import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Landing() {
  return (
    <div className="container-page">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="section py-16">
          <motion.h1 className="text-4xl sm:text-5xl font-extrabold mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>Banking for the modern world</motion.h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">Secure accounts, seamless payments, instant insights. Designed for reliability and speed.</p>
          <div className="mt-8 flex gap-4">
            <Link href="/register" className="btn-primary">Get Started</Link>
            <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">Sign In</Link>
          </div>
        </section>

        {/* Features */}
        <section className="section py-12 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Instant Transfers', desc: 'Send and receive money in seconds domestically and abroad.' },
            { title: 'Enterprise-grade Security', desc: 'Multi-factor auth, device checks, and encryption by default.' },
            { title: 'Real-time Insights', desc: 'Track spending, budgets, and cash flow with live analytics.' },
          ].map((f) => (
            <div key={f.title} className="card-surface p-6">
              <div className="text-lg font-semibold mb-1">{f.title}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Stats */}
        <section className="section py-12 grid gap-6 sm:grid-cols-3">
          {[
            { k: '99.99%', v: 'Uptime' },
            { k: '5M+', v: 'Transactions / mo' },
            { k: '24/7', v: 'Human support' },
          ].map((s) => (
            <div key={s.v} className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
              <div className="text-3xl font-bold text-primary">{s.k}</div>
              <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">{s.v}</div>
            </div>
          ))}
        </section>

        {/* Products */}
        <section className="section py-12 grid gap-6 md:grid-cols-2">
          <div className="card-surface p-6">
            <div className="font-semibold mb-2">Business Accounts</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Multi-user, approvals, virtual cards, and accounting integrations.</p>
            <div className="mt-4"><Link href="/register/business" className="btn-primary text-sm">Open Business Account</Link></div>
          </div>
          <div className="card-surface p-6">
            <div className="font-semibold mb-2">Personal Banking</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No hidden fees, free ATM withdrawals, and smart savings goals.</p>
            <div className="mt-4"><Link href="/register/personal" className="btn-primary text-sm">Get Started</Link></div>
          </div>
        </section>

        {/* Security */}
        <section className="section py-12">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="text-xl font-semibold mb-2">Security-first by design</div>
            <ul className="grid gap-3 sm:grid-cols-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
              <li>Hardware-backed encryption and device binding</li>
              <li>Biometric and passkey support</li>
              <li>Advanced fraud detection and alerts</li>
              <li>Role-based access controls for teams</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="section py-16 text-center">
          <div className="text-2xl font-bold mb-2">Ready to move your money forward?</div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Open an account in minutes. No branch visit required.</p>
          <Link href="/register" className="btn-primary">Open Your Account</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
