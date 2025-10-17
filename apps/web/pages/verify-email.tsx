import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '../lib/supabase/client';
import Button from '../components/ui/Button';

export default function VerifyEmail() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const { token, type } = router.query;

      if (!token || type !== 'signup') return;

      setIsVerifying(true);
      setVerificationError('');

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token as string,
          type: 'signup'
        });

        if (error) {
          setVerificationError(error.message);
        } else {
          setIsVerified(true);
          // Redirect after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (error: any) {
        setVerificationError(error.message || 'Verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [router, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Email Verification
        </h1>

        {isVerifying && (
          <div className="text-center">
            <p>Verifying your email address...</p>
          </div>
        )}

        {isVerified && (
          <div className="text-center text-green-600">
            <p>✅ Email verified successfully!</p>
            <p>Redirecting to your dashboard...</p>
          </div>
        )}

        {verificationError && (
          <div className="text-center text-red-600">
            <p>❌ {verificationError}</p>
            <Button
              onClick={() => router.push('/login')}
              className="mt-4"
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}