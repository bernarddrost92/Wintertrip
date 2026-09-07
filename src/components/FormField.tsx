import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ id, label, children, hint }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label-classified">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}

const inputClasses =
  'w-full border border-white/15 bg-mission-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:border-gold focus:outline-none [color-scheme:dark]';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}
