import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../hooks/useFormSchemas';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { register as apiRegister } from '../lib/auth';
import Modal from '../components/ui/Modal';
import { useState } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';
import { signUpWithEmail } from '../lib/supabase';
import { backendLoginWithSupabase } from '../hooks/useAuth';

 type RegisterForm = {
  firstName: string; lastName: string; email: string; password: string;
  phone?: string; address?: string; country?: string; dob?: string;
};

 type KycForm = {
  phone: string; country: string; address: string; dob: string; idType: string; idNumber: string;
};

export default function Register() {
  const router = useRouter();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({ resolver: yupResolver(registerSchema) });
  const { register: kreg, handleSubmit: ksubmit, formState: { isSubmitting: kSubmitting } } = useForm<KycForm>();

  async function onRegister(v: RegisterForm) {
    // Try client-side Supabase sign up first
    try {
      const { data, error } = await signUpWithEmail({ email: v.email, password: v.password });
      if (error) throw error;
      const session = (data as any)?.session;
      if (session?.access_token) {
        await backendLoginWithSupabase(session.access_token).catch(() => {});
        setVerifyOpen(true);
        return;
      }
      // If no session, prompt user to check email for confirmation
      setVerifyOpen(true);
      return;
    } catch (err) {
      // fallback to backend register (server creates supabase user)
      await apiRegister({ firstName: v.firstName, lastName: v.lastName, email: v.email, password: v.password });
      setVerifyOpen(true);
    }
  }

  async function onVerify(v: KycForm) {
    await api.post('/kyc/submit', v);
    setVerifyOpen(false);
    router.push('/login?verified=1');
  }

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-4">Open your account</h2>
          <form className="card-surface p-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onRegister)}>
            <FormInput label="First name" {...register('firstName')} error={errors.firstName} />
            <FormInput label="Last name" {...register('lastName')} error={errors.lastName} />
            <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
            <FormInput label="Password" type="password" {...register('password')} error={errors.password} />
            <FormInput label="Phone (optional)" type="tel" {...register('phone')} error={undefined as any} />
            <FormInput label="Country (optional)" {...register('country')} error={undefined as any} />
            <FormInput label="Address (optional)" className="md:col-span-2" {...register('address')} error={undefined as any} />
            <FormInput label="Date of birth (optional)" type="date" {...register('dob')} error={undefined as any} />
            <div className="md:col-span-2"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Account'}</Button></div>
          </form>
        </div>
        <div className="card-surface p-6">
          <div className="font-semibold mb-2">Why we verify</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">We verify your identity to protect your account and comply with financial regulations. It only takes a minute.</p>
          <ul className="mt-4 text-sm list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
            <li>Helps prevent fraud</li>
            <li>Keeps your money safe</li>
            <li>Enables higher limits</li>
          </ul>
        </div>
      </main>

      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="Verify your identity">
        <form className="grid gap-3" onSubmit={ksubmit(onVerify)}>
          <FormInput label="Phone" type="tel" {...kreg('phone', { required: true })} error={undefined as any} />
          <FormInput label="Country" {...kreg('country', { required: true })} error={undefined as any} />
          <FormInput label="Address" {...kreg('address', { required: true })} error={undefined as any} />
          <FormInput label="Date of birth" type="date" {...kreg('dob', { required: true })} error={undefined as any} />
          <div>
            <label className="block text-sm font-medium mb-1">ID Type</label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" {...kreg('idType', { required: true })}>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="driver_license">Driver License</option>
            </select>
          </div>
          <FormInput label="ID Number" {...kreg('idNumber', { required: true })} error={undefined as any} />
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={kSubmitting}>{kSubmitting ? 'Submitting…' : 'Submit for Review'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
