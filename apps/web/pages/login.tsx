import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../hooks/useFormSchemas';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { login } from '../lib/auth';
import { signInWithEmailOtp, signInWithPhoneOtp } from '../lib/supabase';
import { useState } from 'react';
import { backendLoginWithSupabase } from '../hooks/useAuth';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string; otp?: string }>({
    resolver: yupResolver(loginSchema),
  });

  async function onEmailOtp(e: string) {
    setMsg(null);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e }),
      });
      const json = await resp.json();
      if (!json.ok) return setMsg(json.message || 'Rate limited');
      const redirect = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?email=${encodeURIComponent(e)}` : undefined;
      await signInWithEmailOtp(e, redirect);
      setMsg('Check your email for a sign-in link');
    } catch (err: any) {
      setMsg(err?.message || 'Error sending email');
    }
  }

  async function onPhoneOtp(phone: string) {
    setMsg(null);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await resp.json();
      if (!json.ok) return setMsg(json.message || 'Rate limited');
      await signInWithPhoneOtp(phone);
      setMsg('Check your phone for an OTP');
    } catch (err: any) {
      setMsg(err?.message || 'Error sending SMS');
    }
  }

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
          <form
            className="card-surface p-6 space-y-4"
            onSubmit={handleSubmit(async (v) => {
              await login(v.email, v.password, v.otp);
              router.push('/dashboard');
            })}
          >
            <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
            <FormInput
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password}
            />
            <FormInput
              label="2FA Code (if enabled)"
              type="text"
              inputMode="numeric"
              {...register('otp')}
              error={errors.otp}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-600">Or quick sign-in</div>
            <div className="flex gap-2">
              <input
                placeholder="you@domain.com"
                id="quick-email"
                className="flex-1 px-3 py-2 rounded-lg border"
              />
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  const v = (document.getElementById('quick-email') as HTMLInputElement).value;
                  onEmailOtp(v);
                }}
              >
                Email Link
              </button>
            </div>
            <div className="flex gap-2">
              <input
                placeholder="+1555..."
                id="quick-phone"
                className="flex-1 px-3 py-2 rounded-lg border"
              />
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  const v = (document.getElementById('quick-phone') as HTMLInputElement).value;
                  onPhoneOtp(v);
                }}
              >
                SMS OTP
              </button>
            </div>
            {msg && <div className="text-sm text-primary">{msg}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
