import Navbar from '../components/Navbar';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Alert from '../components/ui/Alert';
import { login as apiLogin } from '../lib/auth';
import { useAuthStore } from '../state/useAuthStore';

const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

export default function Login() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (formData: any) => {
    setMsg(null);
    try {
      const resp = await apiLogin(formData.email, formData.password);
      if (!resp || !resp.user) {
        // no user returned — likely pending email confirmation
        setMsg('Please check your email to confirm your account before signing in.');
        return;
      }
      setUser(resp.user);
      await router.push('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Sign in failed';
      setMsg(message);
    }
  };

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:block">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Welcome back
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-md">
              Securely access your PremierBank account. Enterprise‑grade encryption, 24/7
              monitoring, and FDIC‑insured partner banks.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" /> Real‑time transaction alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" /> Advanced fraud protection
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" /> Priority customer support
              </li>
            </ul>
          </div>
        </div>
        <div>
          <div className="card-surface p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Sign in to your account</h2>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
              <FormInput
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password}
              />
              <div className="flex items-center justify-between">
                <Link href="/forgot-password" legacyBehavior>
                  <a className="text-sm text-primary hover:underline">Forgot password?</a>
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
            {msg && (
              <div className="mt-4">
                <Alert kind="error">{msg}</Alert>
              </div>
            )}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              New to PremierBank?{' '}
              <Link href="/register" legacyBehavior>
                <a className="text-primary hover:underline">Open an account</a>
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
