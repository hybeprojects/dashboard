import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Register() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-20 max-w-3xl mx-auto">
        <div className="card-surface p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Choose account type</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Select the account type that best fits your needs. Business accounts have additional
            requirements and a minimum initial deposit.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <div className="font-semibold mb-2">Premier Business Checking</div>
              <div className="text-sm text-gray-600 mb-4">
                Business accounts require additional KYC and a minimum initial deposit of $500.
              </div>
              <Link href="/register/business" className="btn-primary">
                Open Business Account
              </Link>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="font-semibold mb-2">Premier Free Checking</div>
              <div className="text-sm text-gray-600 mb-4">
                Fast, no-fee personal checking. Optionally add a linked savings account.
              </div>
              <Link href="/register/personal" className="btn-primary">
                Open Personal Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
