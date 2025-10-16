import Navbar from '../../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { businessRegisterSchema } from '../../hooks/useFormSchemas';
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
  businessName: string;
  businessAddress: string;
  taxId: string;
  annualIncome: number;
  depositAccountNumber: string;
  routingNumber: string;
  initialDeposit: number;
  representativeName: string;
  representativeSsn: string;
  idFront?: FileList;
  idBack?: FileList;
  proofAddress?: FileList;
};

export default function BusinessRegister() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: yupResolver(businessRegisterSchema) });

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
        kycForm.append('accountType', 'business');
        await api.post('/kyc/submit', kycForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
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
        <h2 className="text-2xl font-bold mb-4">Premier Business Checking</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Minimum initial deposit: $500. Provide business details and verification documents to
          speed up onboarding.
        </p>
        <form className="card-surface p-4 sm:p-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormInput label="First name" {...register('firstName')} error={errors.firstName} />
          <FormInput label="Last name" {...register('lastName')} error={errors.lastName} />
          <FormInput label="Email" type="email" {...register('email')} error={errors.email} />
          <FormInput
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password}
          />
          <FormInput
            label="Business name"
            {...register('businessName')}
            error={errors.businessName}
          />
          <FormInput
            label="Business address"
            {...register('businessAddress')}
            error={errors.businessAddress}
          />
          <FormInput label="Tax ID (EIN)" {...register('taxId')} error={errors.taxId} />
          <FormInput
            label="Annual business income"
            type="number"
            {...register('annualIncome')}
            error={errors.annualIncome}
          />
          <FormInput
            label="Funding account number"
            {...register('depositAccountNumber')}
            error={errors.depositAccountNumber}
          />
          <FormInput
            label="Routing number"
            {...register('routingNumber')}
            error={errors.routingNumber}
          />
          <FormInput
            label="Initial deposit (USD)"
            type="number"
            {...register('initialDeposit')}
            error={errors.initialDeposit}
          />
          <hr className="my-4 md:col-span-2" />
          <div className="text-lg font-semibold md:col-span-2">Authorized representative</div>
          <FormInput
            label="Full name"
            {...register('representativeName')}
            error={errors.representativeName}
          />
          <FormInput
            label="SSN"
            {...register('representativeSsn')}
            error={errors.representativeSsn}
          />
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">ID document (front)</label>
            <input
              className="w-full"
              type="file"
              accept="image/*,.pdf"
              {...register('idFront' as any)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">ID document (back)</label>
            <input
              className="w-full"
              type="file"
              accept="image/*,.pdf"
              {...register('idBack' as any)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">
              Proof of address (utility bill or bank statement)
            </label>
            <input
              className="w-full"
              type="file"
              accept="image/*,.pdf"
              {...register('proofAddress' as any)}
            />
          </div>
          <div className="md:col-span-2 flex">
            <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Create Business Account'}
            </Button>
          </div>
          {status && <div className="md:col-span-2 text-sm mt-2 text-primary">{status}</div>}
        </form>
      </main>
    </div>
  );
}
