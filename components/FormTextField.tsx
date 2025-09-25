import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface FormTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

export const FormTextField = forwardRef<HTMLInputElement, FormTextFieldProps>(function FormTextField(
  { label, name, error, className, ...rest },
  ref
) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <input
        ref={ref}
        id={name}
        name={name}
        className={`rounded-md border border-slate-300 px-3 py-2 text-base font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${className ?? ""}`}
        {...rest}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
});
