// apps/web/pages/reset-password.tsx
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (token) setAccessToken(token);
  }, []);

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!accessToken) {
      setError('Missing access token');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to update password');
      setMessage('Password updated successfully. You can now log in with your new password.');
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    }
    setLoading(false);
  };

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16">
        <div className="max-w-md mx-auto">
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Reset Password</h2>
            <form className="mt-4 space-y-4" onSubmit={handlePasswordReset}>
              <FormInput
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
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

export default ResetPassword;
