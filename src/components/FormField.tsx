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
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

/* Work fields: 46px+ tall, 16px text (also stops iOS zooming in), readable
   placeholders — legibility over decoration. */
const inputClasses =
  'min-h-[46px] w-full border border-white/15 bg-mission-raised px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted/80 transition-colors focus:border-gold focus:outline-none [color-scheme:dark]';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}
