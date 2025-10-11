import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { useEffect, useState } from 'react';
import api from '../lib/api';

const schema = yup.object({
  to: yup.string().required('Recipient required'),
  amount: yup.number().positive('Positive amount').required('Amount required'),
});

type Form = { to: string; amount: number };

export default function Payments() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: yupResolver(schema) });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/api/accounts')
      .then((r) => setAccounts(r.data || r.data?.accounts || []))
      .catch(() => {});
  }, []);

  async function onSubmit(values: Form) {
    setMsg(null);
    try {
      const from = accounts?.[0]?.id || values.to; // fallback
      const resp = await api.post('/api/transactions/transfer', {
        fromAccountId: from,
        toAccountNumber: values.to,
        amount: values.amount,
      });
      if (resp.data && (resp.data.success || resp.data.tx)) {
        setMsg('Transfer submitted');
      } else {
        setMsg('Transfer submitted (no ledger confirmation)');
      }
    } catch (err: any) {
      setMsg(err?.response?.data?.error || err?.message || 'Transfer failed');
    }
  }

  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">New Payment</h3>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <FormInput label="Recipient Account ID" {...register('to')} error={errors.to as any} />
              <FormInput
                label="Amount"
                type="number"
                step="0.01"
                {...register('amount')}
                error={errors.amount as any}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing…' : 'Send'}
                </Button>
              </div>
              {msg && <div className="md:col-span-2 text-sm text-primary">{msg}</div>}
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
