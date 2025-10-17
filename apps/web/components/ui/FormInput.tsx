import React, { forwardRef } from 'react';
import { InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: FieldError };

const FormInput = forwardRef<HTMLInputElement, Props>(({ label, error, ...props }, ref) => {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input ref={ref} className="input-field" {...props} aria-invalid={!!error} aria-errormessage={error?.message} />
      {error && (
        <span className="mt-1 block text-xs text-red-600" role="alert">{error.message}</span>
      )}
    </label>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
