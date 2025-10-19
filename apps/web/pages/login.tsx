import Navbar from '../components/Navbar';
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
      <main className="section py-10 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
          <form className="card-surface p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
            <FormInput
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 space-y-3">{msg && <Alert kind="error">{msg}</Alert>}</div>
        </div>
      </main>
    </div>
  );
}
