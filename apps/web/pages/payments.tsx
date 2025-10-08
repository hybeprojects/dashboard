import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';

const schema = yup.object({
  to: yup.string().required('Recipient required'),
  amount: yup.number().positive('Positive amount').required('Amount required'),
});

export default function Payments() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ to: string; amount: number }>({ resolver: yupResolver(schema) });
  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">New Payment</h3>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(async () => { await new Promise((r) => setTimeout(r, 400)); })}>
              <FormInput label="Recipient" {...register('to')} error={errors.to as any} />
              <FormInput label="Amount" type="number" step="0.01" {...register('amount')} error={errors.amount as any} />
              <div className="md:col-span-2"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing…' : 'Send'}</Button></div>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
