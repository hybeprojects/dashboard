import Link from 'next/link';
import Navbar from '../../components/Navbar';

export default function Register() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Choose Account Type</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Select whether you are opening a personal or business account.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link href="/register/personal" className="card-surface p-8 rounded-lg hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Personal Account</h3>
            <p>For individuals. Get a free checking and optional savings account.</p>
          </Link>
          <Link href="/register/business" className="card-surface p-8 rounded-lg hover:shadow-lg transition">
            <h3 className="text-xl font-bold mb-2">Business Account</h3>
            <p>For companies. Manage your business finances with our premier checking account.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}