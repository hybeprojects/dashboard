import { useRouter } from 'next/router';
import Button from '../components/ui/Button';

export default function VerifyEmail() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
        <div className="text-center text-gray-700 dark:text-gray-300 space-y-2">
          <p>If you recently signed up, your account is ready to use.</p>
          <p>You can proceed to sign in to your dashboard.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
