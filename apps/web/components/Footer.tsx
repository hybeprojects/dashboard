import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 dark:border-gray-800">
      <div className="section py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-xl font-semibold text-primary">PremierBank</div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Secure, modern banking for individuals and businesses. FDIC-insured partner banks. 24/7 support.</p>
        </div>
        <div>
          <div className="font-semibold mb-3">Products</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/accounts" className="hover:underline">Checking</Link></li>
            <li><Link href="/accounts" className="hover:underline">Savings</Link></li>
            <li><Link href="/payments" className="hover:underline">Payments</Link></li>
            <li><Link href="/dashboard" className="hover:underline">Analytics</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/security" className="hover:underline">Security</Link></li>
            <li><Link href="/support" className="hover:underline">Support</Link></li>
            <li><Link href="/legal" className="hover:underline">Legal</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>support@premierbank.app</li>
            <li>+1 (555) 010-9900</li>
            <li>Mon–Fri, 8am–6pm</li>
          </ul>
          <div className="mt-4">
            <Link href="/register" className="btn-primary text-sm">Open Account</Link>
          </div>
        </div>
      </div>
      <div className="section pb-8 text-xs text-gray-500 dark:text-gray-500">
        © {new Date().getFullYear()} PremierBank. All rights reserved.
      </div>
    </footer>
  );
}
