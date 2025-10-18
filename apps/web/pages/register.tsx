import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Register() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Open a New Account</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Choose the type of account you would like to open.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/register/personal">
            <a className="card-surface p-6 block text-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Personal Account</h3>
              <p className="text-gray-600 dark:text-gray-400">
                For individuals. Get a free checking and savings account with no monthly fees.
              </p>
            </a>
          </Link>
          <Link href="/register/business">
            <a className="card-surface p-6 block text-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Business Account</h3>
              <p className="text-gray-600 dark:text-gray-400">
                For businesses of all sizes. Get a powerful checking account with business-focused features.
              </p>
            </a>
          </Link>
        </div>
      </main>
    </div>
  );
}