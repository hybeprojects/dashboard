// apps/web/pages/reset-password.tsx
import { useState, useEffect } from 'react';
import getSupabase from '../lib/supabase';
import { useRouter } from 'next/router';

const ResetPassword = () => {
  const supabase = getSupabase();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div>
      <h1>Reset Password</h1>
      <form onSubmit={handlePasswordReset}>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
};

export default ResetPassword;
