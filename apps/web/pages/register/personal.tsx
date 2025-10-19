import Navbar from '../../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { personalRegisterSchema } from '../../hooks/useFormSchemas';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { useState } from 'react';
import { useRouter } from 'next/router';

type Form = {
  fullName: string;
  dob: string;
  ssn: string;
  address: string;
  email: string;
  password: string;
  openSavings?: boolean;
  idFront?: FileList;
  idBack?: FileList;
  proofAddress?: FileList;
};

export default function PersonalRegister() {
  const router = useRouter();
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
      // perform signup first
      const names = (v.fullName || '').trim().split(/\s+/);
      const firstName = names.shift() || '';
      const lastName = names.join(' ');

      const signupResp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: v.email,
          password: v.password,
          firstName,
          lastName,
          userType: 'personal',
        }),
      });
      const signupBody = await signupResp.json();
      if (!signupResp.ok) throw new Error(signupBody?.error || 'Signup failed');

      // proceed with KYC submission
      const form = new FormData();
      Object.entries(v).forEach(([k, val]) => {
        if (val === undefined || val === null) return;
        if (k === 'idFront' || k === 'idBack' || k === 'proofAddress') {
          const files = val as any as FileList;
          if (files && files[0]) form.append(k, files[0]);
          return;
        }
        form.append(k, String(val));
      });
      form.append('accountType', 'personal');
      form.append('openSavings', v.openSavings ? '1' : '0');

      await api.post('/kyc/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (v.openSavings) {
        await api.post('/accounts', { type: 'savings', linkedTo: 'primary' }).catch(() => {});
      }

      setStatus('Submitted — verification in progress. Check your email for confirmation.');
      router.push('/register/complete?type=personal');
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
        <form className="card-surface p-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="Full name" {...register('fullName')} error={errors.fullName} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Email" {...register('email', { required: 'Email is required' })} error={(errors as any).email} />
            <FormInput
              label="Password"
              type="password"
              {...register('password', { required: 'Password is required', minLength: { value: 12, message: 'Use 12+ chars' } })}
              error={(errors as any).password}
            />
          </div>

          <FormInput label="Date of birth" type="date" {...register('dob')} error={errors.dob} />
          <FormInput label="SSN" {...register('ssn')} error={errors.ssn} />
          <FormInput label="Address" {...register('address')} error={errors.address} />

          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" {...register('openSavings' as any)} />
              <span className="text-sm">Also open a Premier Free Savings account</span>
            </label>
          </div>

          <hr className="my-4" />

          <div className="text-lg font-semibold">Verification documents</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm mb-1">ID document (front)</label>
              <input
                className="input-field"
                type="file"
                accept="image/*,.pdf"
                {...register('idFront' as any)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">ID document (back)</label>
              <input
                className="input-field"
                type="file"
                accept="image/*,.pdf"
                {...register('idBack' as any)}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm mb-1">
              Proof of address (utility bill or bank statement)
            </label>
            <input
              className="input-field"
              type="file"
              accept="image/*,.pdf"
              {...register('proofAddress' as any)}
            />
          </div>

          <div className="flex justify-end">
            <Button className="w-full md:w-auto" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Create Personal Account'}
            </Button>
          </div>
          {status && <div className="text-sm mt-2 text-primary">{status}</div>}
        </form>
      </main>
    </div>
  );
}
