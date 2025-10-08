import { InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: FieldError };
export default function FormInput({ label, error, ...props }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input className="input-field" {...props} aria-invalid={!!error} aria-errormessage={error?.message} />
      {error && <span className="mt-1 block text-xs text-red-600" role="alert">{error.message}</span>}
    </label>
  );
}
