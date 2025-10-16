import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import { useState } from 'react';
import Alert from '../../components/ui/Alert';
import Navbar from '../../components/Navbar';

const signupSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  userType: yup.string().oneOf(['personal', 'business']).required(),
});

export default function SignupPage() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(signupSchema),
  });

  const onSubmit = async (data: any) => {
    setMsg(null);
    const res = await fetch('/api/auth/signup', {
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
        <h2 className="text-2xl font-bold mb-4">Open your account</h2>
        <form className="card-surface p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="First Name" {...register('firstName')} error={errors.firstName} />
          <FormInput label="Last Name" {...register('lastName')} error={errors.lastName} />
          <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
          <FormInput
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password}
          />
          <div className="flex items-center">
            <input
              type="radio"
              id="personal"
              value="personal"
              {...register('userType')}
              className="mr-2"
              name="userType"
            />
            <label htmlFor="personal">Personal</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="business"
              value="business"
              {...register('userType')}
              className="mr-2"
              name="userType"
            />
            <label htmlFor="business">Business</label>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Account'}
          </Button>
          {msg && <Alert kind="error">{msg}</Alert>}
        </form>
      </main>
    </div>
  );
}