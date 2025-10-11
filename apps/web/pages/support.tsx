'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Support() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Support</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Need help? Our support team is available 24/7 to assist with account issues, payments, and security questions.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Contact us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email: support@premierbank.app<br/>Phone: +1 (555) 010-9900</p>
          </div>
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Help center</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Visit our knowledge base for guides on onboarding, payments, and security.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
