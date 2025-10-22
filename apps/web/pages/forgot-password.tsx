// apps/web/pages/forgot-password.tsx
import Navbar from '../components/Navbar';
import { useState } from 'react';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/reset-password` }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to request reset');
      setMessage('Password reset link sent. Please check your email.');
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    }
  };

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16">
        <div className="max-w-md mx-auto">
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Forgot Password</h2>
            <form className="mt-4 space-y-4" onSubmit={handlePasswordReset}>
              <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Send Reset Link
              </Button>
            </form>

            <div className="mt-4">
              {message && <Alert kind="success">{message}</Alert>}
              {error && <Alert kind="error">{error}</Alert>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
