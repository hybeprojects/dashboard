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
      setStatus('Submitted — verification in progress');
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

        {/* Use a responsive grid: single column on very small screens, two columns on sm+, with
            specific fields spanning both columns when appropriate */}
        <form
          className="card-surface p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="sm:col-span-2">
            <FormInput label="Full name" {...register('fullName')} error={errors.fullName} />
          </div>

          <div>
            <FormInput label="Date of birth" type="date" {...register('dob')} error={errors.dob} />
          </div>

          <div>
            <FormInput label="SSN" {...register('ssn')} error={errors.ssn} />
          </div>

          <div className="sm:col-span-2">
            <FormInput label="Address" {...register('address')} error={errors.address} />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register('openSavings' as any)} />
              <span className="text-sm">Also open a Premier Free Savings account</span>
            </label>
          </div>

          <hr className="my-2 sm:col-span-2" />

          <div className="sm:col-span-2 text-lg font-semibold">Verification documents</div>

          {/* File inputs laid out compactly: stacked on small screens, side-by-side on larger */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:col-span-2">
            <div>
              <label className="block text-sm mb-1">ID document (front)</label>
              <input
                className="w-full text-sm text-gray-700 file-input"
                type="file"
                accept="image/*,.pdf"
                {...register('idFront' as any)}
                aria-label="ID front"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">ID document (back)</label>
              <input
                className="w-full text-sm text-gray-700 file-input"
                type="file"
                accept="image/*,.pdf"
                {...register('idBack' as any)}
                aria-label="ID back"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Proof of address</label>
              <input
                className="w-full text-sm text-gray-700 file-input"
                type="file"
                accept="image/*,.pdf"
                {...register('proofAddress' as any)}
                aria-label="Proof of address"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Create Personal Account'}
            </Button>
          </div>

          {status && (
            <div className="text-sm mt-2 text-primary sm:col-span-2">{status}</div>
          )}
        </form>
      </main>
    </div>
  );
}
