import type { InputHTMLAttributes, ReactNode, Ref } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function FormField({
  id,
  label,
  error,
  trailing,
  ref,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="input-shell" data-invalid={Boolean(error)}>
        <input
          {...inputProps}
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
