import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import { useEffect, useState } from 'react';
import api from '../lib/api';

const schema = yup.object({
  fromAccountId: yup.string().nullable(),
  to: yup.string().required('Recipient required'),
  amount: yup.number().positive('Positive amount').required('Amount required'),
});

type Form = { fromAccountId?: string | null; to: string; amount: number };

export default function Payments() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: yupResolver(schema) });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ kind: 'success' | 'error' | 'info'; msg: string } | null>(
    null,
  );

  const watchedTo = watch('to');

  useEffect(() => {
    api
      .get('/accounts')
      .then((r) => setAccounts(r.data?.accounts || r.data || []))
      .catch(() => {});
  }, []);

  async function onSubmit(values: Form) {
    setAlert(null);
    try {
      const from = values.fromAccountId || accounts?.[0]?.id || null;
      if (!from) throw new Error('No source account available');

      const resp = await api.post('/transfer', {
        fromAccountId: from,
        toAccountId: values.to,
        amount: values.amount,
      });

      if (resp.data && (resp.data.success || resp.data.tx)) {
        setAlert({ kind: 'success', msg: 'Transfer submitted' });
      } else {
        setAlert({ kind: 'info', msg: 'Transfer submitted (no ledger confirmation)' });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Transfer failed';
      setAlert({ kind: 'error', msg: String(message) });
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
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">From account</label>
                {accounts.length ? (
                  <select className="input-field w-full" {...register('fromAccountId')}>
                    {accounts.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.type || 'Account'} — #{a.id} — ${Number(a.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-500">No linked accounts found</div>
                )}
              </div>

              <FormInput
                label="Recipient Account ID"
                {...register('to')}
                error={errors.to as any}
              />

              <div className="md:col-span-2 text-xs text-gray-500">
                {watchedTo && watchedTo.length < 5 ? (
                  <div>Recipient ID looks short — ensure you entered a full account ID.</div>
                ) : (
                  <div>
                    Enter the recipient's account ID. For external transfers, use the provided
                    reference.
                  </div>
                )}
              </div>

              <FormInput
                label="Amount"
                type="number"
                step="0.01"
                {...register('amount')}
                error={errors.amount as any}
              />

              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting || accounts.length === 0}>
                  {isSubmitting ? 'Processing…' : 'Send'}
                </Button>
              </div>

              <div className="md:col-span-2" aria-live="polite">
                {alert && (
                  <Alert kind={alert.kind === 'error' ? 'error' : alert.kind}>{alert.msg}</Alert>
                )}
              </div>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
