import Navbar from '../../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { personalRegisterSchema } from '../../hooks/useFormSchemas';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { register as apiRegister } from '../../lib/auth';
import { useAuthStore } from '../../state/useAuthStore';

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dob: string;
  ssn: string;
  address: string;
  openSavings?: boolean;
  idFront?: FileList;
  idBack?: FileList;
  proofAddress?: FileList;
};

export default function PersonalRegister() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch: _watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: yupResolver(personalRegisterSchema) });
  async function onSubmit(v: Form) {
    setStatus(null);
    try {
      const data = await apiRegister({
        email: v.email,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
      });
      if (data && data.accessToken) {
        if (typeof window !== 'undefined') localStorage.setItem('token', data.accessToken);
        setUser({ id: '', email: v.email, firstName: v.firstName, lastName: v.lastName });
        const kycForm = new FormData();
        Object.entries(v).forEach(([k, val]) => {
          if (val === undefined || val === null) return;
          if (k === 'idFront' || k === 'idBack' || k === 'proofAddress') {
            const files = val as any as FileList;
            if (files && files[0]) kycForm.append(k, files[0]);
            return;
          }
          kycForm.append(k, String(val));
        });
        kycForm.append('accountType', 'personal');
        kycForm.append('openSavings', v.openSavings ? '1' : '0');
        await api.post('/kyc/submit', kycForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (v.openSavings) {
          await api.post('/accounts', { type: 'savings', linkedTo: 'primary' }).catch(() => {});
        }
        setStatus('Submitted — verification in progress');
        router.push('/dashboard');
      } else {
        setStatus('Account created but no token returned');
      }
    } catch (err: any) {
      setStatus(err?.message || 'Submission failed');
    }
  }

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Premier Free Checking</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          No monthly fees. Complete KYC to open your account. Optionally add a linked savings
          account during signup.
        </p>
        <form className="card-surface p-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="First name" {...register('firstName')} error={errors.firstName} />
          <FormInput label="Last name" {...register('lastName')} error={errors.lastName} />
          <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
          <FormInput
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password}
          />
          <FormInput label="Date of birth" type="date" {...register('dob')} error={errors.dob} />
          <FormInput label="SSN" {...register('ssn')} error={errors.ssn} />
          <FormInput label="Address" {...register('address')} error={errors.address} />

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register('openSavings' as any)} />
              <span className="text-sm">Also open a Premier Free Savings account</span>
            </label>
          </div>

          <hr className="my-4 md:col-span-2" />

          <div className="text-lg font-semibold md:col-span-2">Verification documents</div>
          <div>
            <label className="block text-sm mb-1">ID document (front)</label>
            <input type="file" accept="image/*,.pdf" {...register('idFront' as any)} />
          </div>
          <div>
            <label className="block text-sm mb-1">ID document (back)</label>
            <input type="file" accept="image/*,.pdf" {...register('idBack' as any)} />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Proof of address (utility bill or bank statement)
            </label>
            <input type="file" accept="image/*,.pdf" {...register('proofAddress' as any)} />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Create Personal Account'}
            </Button>
          </div>
          {status && <div className="md:col-span-2 text-sm mt-2 text-primary">{status}</div>}
        </form>
      </main>
    </div>
  );
}
