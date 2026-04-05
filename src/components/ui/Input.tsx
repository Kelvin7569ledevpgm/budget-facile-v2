import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  id: string;
};

export function Input({ label, id, className = '', ...rest }: InputProps) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="label">
          {label}
        </label>
      ) : null}
      <input id={id} className={`input ${className}`.trim()} {...rest} />
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  id: string;
};

export function Select({ label, id, className = '', children, ...rest }: SelectProps) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="label">
          {label}
        </label>
      ) : null}
      <select id={id} className={`select ${className}`.trim()} {...rest}>
        {children}
      </select>
    </div>
  );
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  id: string;
};

export function TextArea({ label, id, className = '', ...rest }: TextAreaProps) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="label">
          {label}
        </label>
      ) : null}
      <textarea id={id} className={`input ${className}`.trim()} {...rest} />
    </div>
  );
}
