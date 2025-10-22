import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Register() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-12 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Open a New Account</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Choose the type of account you would like to open.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/register/personal"
            className="card-surface p-6 block text-left hover:shadow-md transition-shadow duration-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">P</div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Personal Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">For individuals. Get a free checking and savings account with no monthly fees.</p>
                <div className="mt-4">
                  <span className="text-primary font-medium">Get Started →</span>
                </div>
              </div>
            </div>
          </Link>
          <Link
            href="/register/business"
            className="card-surface p-6 block text-left hover:shadow-md transition-shadow duration-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">B</div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Business Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">For businesses of all sizes. Get a powerful checking account with business-focused features.</p>
                <div className="mt-4">
                  <span className="text-primary font-medium">Open Business →</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
