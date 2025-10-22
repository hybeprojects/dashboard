// apps/web/pages/reset-password.tsx
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import getSupabase from '../lib/supabase';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ResetPassword = () => {
  const supabase = getSupabase();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (accessToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
    }
  }, [supabase]);

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase client not available');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully. You can now log in with your new password.');
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
