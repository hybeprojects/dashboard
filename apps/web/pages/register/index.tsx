import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function RegisterIndex() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Open your account</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Choose the right account type to get started.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-surface p-6">
            <div className="font-semibold mb-2">Personal Banking</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No monthly fees, free ATM withdrawals, and smart savings goals.
            </p>
            <div className="mt-4">
              <Link href="/register/personal" className="btn-primary text-sm" aria-label="Open a personal account">
                Continue — Personal
              </Link>
            </div>
          </div>
          <div className="card-surface p-6">
            <div className="font-semibold mb-2">Business Accounts</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Multi-user, approvals, virtual cards, and accounting integrations.
            </p>
            <div className="mt-4">
              <Link href="/register/business" className="btn-primary text-sm" aria-label="Open a business account">
                Continue — Business
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
