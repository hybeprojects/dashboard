import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Landing() {
  return (
    <div className="container-page">
      <Navbar />

      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>

      <main id="main" role="main">
        {/* Hero */}
        <section id="hero" aria-labelledby="hero-heading" className="section py-20">
          <div className="max-w-3xl">
            <motion.h1
              id="hero-heading"
              className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Banking for the modern world
            </motion.h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Secure accounts, seamless payments, instant insights. Designed for reliability and
              speed.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/register"
                className="btn-primary w-full sm:w-auto"
                role="button"
                aria-label="Get started — open an account"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="btn-secondary w-full sm:w-auto"
                role="button"
                aria-label="Sign in to your account"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="section py-12 grid gap-6 md:grid-cols-3">
          <h2 id="features-heading" className="sr-only">
            Key features
          </h2>
          {[
            {
              title: 'Instant Transfers',
              desc: 'Send and receive money in seconds domestically and abroad.',
            },
            {
              title: 'Enterprise-grade Security',
              desc: 'Multi-factor auth, device checks, and encryption by default.',
            },
            {
              title: 'Real-time Insights',
              desc: 'Track spending, budgets, and cash flow with live analytics.',
            },
          ].map((f) => {
            const id = 'feat-' + f.title.replace(/\s+/g, '-').toLowerCase();
            return (
              <article key={f.title} className="card-surface p-6 flex flex-col gap-3" aria-labelledby={id}>
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold"
                    aria-hidden
                  >
                    {f.title[0]}
                  </span>
                  <div id={id} className="text-lg font-semibold">
                    {f.title}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </article>
            );
          })}
        </section>

        {/* Stats */}
        <section aria-labelledby="stats-heading" className="section py-12 grid gap-6 sm:grid-cols-3">
          <h2 id="stats-heading" className="sr-only">
            Platform statistics
          </h2>
          {[
            { k: '99.99%', v: 'Uptime' },
            { k: '5M+', v: 'Transactions / mo' },
            { k: '24/7', v: 'Human support' },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center"
              role="group"
              aria-label={s.v + ' ' + s.k}
            >
              <div className="text-3xl font-bold text-primary">{s.k}</div>
              <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">{s.v}</div>
            </div>
          ))}
        </section>

        {/* Products */}
        <section aria-labelledby="products-heading" className="section py-12 grid gap-6 md:grid-cols-2">
          <h2 id="products-heading" className="sr-only">
            Products
          </h2>
          <div className="card-surface p-6">
            <div className="font-semibold mb-2">Business Accounts</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Multi-user, approvals, virtual cards, and accounting integrations.
            </p>
            <div className="mt-4">
              <Link href="/register/business" className="btn-primary text-sm" role="button" aria-label="Open a business account">
                Open Business Account
              </Link>
            </div>
          </div>
          <div className="card-surface p-6">
            <div className="font-semibold mb-2">Personal Banking</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No hidden fees, free ATM withdrawals, and smart savings goals.
            </p>
            <div className="mt-4">
              <Link href="/register/personal" className="btn-primary text-sm" role="button" aria-label="Open a personal account">
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Security */}
        <section aria-labelledby="security-heading" className="section py-12">
          <h2 id="security-heading" className="text-xl font-semibold mb-2">
            Security-first by design
          </h2>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <ul className="grid gap-3 sm:grid-cols-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
              <li>Hardware-backed encryption and device binding</li>
              <li>Biometric and passkey support</li>
              <li>Advanced fraud detection and alerts</li>
              <li>Role-based access controls for teams</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-heading" className="section py-16 text-center">
          <h2 id="cta-heading" className="text-2xl font-bold mb-2">
            Ready to move your money forward?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Open an account in minutes. No branch visit required.
          </p>
          <Link href="/register" className="btn-primary" role="button" aria-label="Open your account — Get started">
            Open Your Account
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
