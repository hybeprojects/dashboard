import React, { forwardRef, InputHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: FieldError };

const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...props }, forwardedRef) => {
    // Extract potential register props so we can attach refs correctly
    // register returns { onChange, onBlur, name, ref }
    const { ref: registerRef, ...rest } = props as any;
    const inputClass = `${className ? className + ' ' : ''}input-field`;

    // Combine forwarded ref and register ref so both work correctly
    const setRefs = (el: HTMLInputElement | null) => {
      if (!el) return;
      // forwardedRef can be a function or object
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef && typeof forwardedRef === 'object') (forwardedRef as any).current = el;

      if (typeof registerRef === 'function') registerRef(el);
      else if (registerRef && typeof registerRef === 'object') (registerRef as any).current = el;
    };

    const errorId = error
      ? `${String((props as any).name || label).replace(/\s+/g, '-')}-error`
      : undefined;

    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <input
          ref={setRefs}
          className={inputClass}
          {...rest}
          aria-invalid={!!error}
          aria-describedby={errorId}
        />
        {error && (
          <span id={errorId} className="mt-1 block text-xs text-red-600" role="alert">
            {error.message}
          </span>
        )}
      </label>
    );
  },
);

FormInput.displayName = 'FormInput';

export default FormInput;
