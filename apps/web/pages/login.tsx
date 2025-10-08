import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../hooks/useFormSchemas';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { login } from '../lib/auth';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string; password: string; otp?: string }>({ resolver: yupResolver(loginSchema) });

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
          <form className="card-surface p-6 space-y-4" onSubmit={handleSubmit(async (v) => { await login(v.email, v.password, v.otp); })}>
            <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
            <FormInput label="Password" type="password" {...register('password')} error={errors.password} />
            <FormInput label="2FA Code (if enabled)" type="text" inputMode="numeric" {...register('otp')} error={errors.otp} />
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign In'}</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
