import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', containerClassName = '', type = 'text', ...props }, ref) => {
    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 outline-none
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-danger bg-danger/5 text-danger focus:ring-1 focus:ring-danger'
                  : 'border-border bg-white dark:bg-dark dark:border-border/10 text-text dark:text-white focus:border-accent focus:ring-1 focus:ring-accent'
              }
              disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
