import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Alert from '../components/ui/Alert';

const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

export default function Login() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
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
      const supabase = createClient();
      const { data: resData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // Successful sign in; redirect to dashboard. Session is managed by Supabase client.
      router.push('/dashboard');
    } catch (err: any) {
      setMsg(err.message || 'Sign in failed');
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
