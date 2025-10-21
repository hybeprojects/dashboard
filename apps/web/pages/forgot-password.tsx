// apps/web/pages/forgot-password.tsx
import { useState } from 'react';
import getSupabase from '../lib/supabase';

const ForgotPassword = () => {
  const supabase = getSupabase();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase client not available');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent. Please check your email.');
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={handlePasswordReset}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
};

export default ForgotPassword;
