import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { useState } from 'react';
import Alert from '../components/ui/Alert';
import Navbar from '../components/Navbar';

const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
  otp: yup.string(),
});

export default function LoginPage() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setMsg(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const { message } = await res.json();
      setMsg(message);
    }
  };

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form className="card-surface p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
          {msg && <Alert kind="error">{msg}</Alert>}
        </form>
      </main>
    </div>
  );
}