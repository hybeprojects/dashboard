import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function RegisterComplete() {
  const router = useRouter();
  const type = typeof router.query.type === 'string' ? router.query.type : 'personal';

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Registration submitted</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Thank you — your {type === 'business' ? 'business' : 'personal'} registration has been
          received. Our team is reviewing your submission and you will receive an email when the
          verification is complete.
        </p>
        <div className="space-y-4">
          <Link href="/login" className="btn-secondary">
            Back to Sign In
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:underline block">
            Return to home
          </Link>
        </div>
      </main>
    </div>
  );
}
