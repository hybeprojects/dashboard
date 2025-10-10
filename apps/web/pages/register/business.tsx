import Navbar from '../../components/Navbar';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { businessRegisterSchema } from '../../hooks/useFormSchemas';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { useState } from 'react';
import { useRouter } from 'next/router';

type Form = {
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
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: yupResolver(businessRegisterSchema) });

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
      // include account type
      form.append('accountType', 'business');
      const res = await api
        .post('/kyc/submit', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .catch((e) => {
          throw e;
        });
      setStatus('Submitted — verification in progress');
      router.push('/register/complete?type=business');
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
        <form className="card-surface p-4 sm:p-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
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
          <hr className="my-4" />
          <div className="text-lg font-semibold">Authorized representative</div>
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
          <div>
            <label className="block text-sm mb-1">ID document (front)</label>
            <input
              className="w-full"
              type="file"
              accept="image/*,.pdf"
              {...register('idFront' as any)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ID document (back)</label>
            <input
              className="w-full"
              type="file"
              accept="image/*,.pdf"
              {...register('idBack' as any)}
            />
          </div>
          <div>
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
          <div className="flex">
            <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Create Business Account'}
            </Button>
          </div>
          {status && <div className="text-sm mt-2 text-primary">{status}</div>}
        </form>
      </main>
    </div>
  );
}
