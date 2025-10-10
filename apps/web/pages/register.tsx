import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../hooks/useFormSchemas';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import Navbar from '../components/Navbar';
import { register as apiRegister } from '../lib/auth';
import { useRouter } from 'next/router';
import { useAuthStore } from '../state/useAuthStore';
import Alert from '../components/ui/Alert';

export default function Register() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ firstName: string; lastName: string; email: string; password: string }>({
    resolver: yupResolver(registerSchema),
  });
  const [msg, setMsg] = require('react').useState<string | null>(null);

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10">
        <h2 className="text-2xl font-bold mb-4">Open your account</h2>
        <form
          className="card-surface p-6 grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit(async (v) => {
            setMsg(null);
            try {
              const data = await apiRegister({
                email: v.email,
                password: v.password,
                firstName: v.firstName,
                lastName: v.lastName,
              });
              if (data && data.token && data.user) {
                if (typeof window !== 'undefined') localStorage.setItem('token', data.token);
                setUser({ id: data.user.id, email: data.user.email, firstName: data.user.name });
                router.push('/dashboard');
              } else {
                setMsg('Account created but no token returned');
              }
            } catch (err: any) {
              setMsg(err?.response?.data?.error || err?.message || 'Account creation failed');
            }
          })}
        >
          <FormInput label="First name" {...register('firstName')} error={errors.firstName} />
          <FormInput label="Last name" {...register('lastName')} error={errors.lastName} />
          <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
          <FormInput
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
          {msg && (
            <div className="md:col-span-2">
              <Alert kind="error">{msg}</Alert>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
