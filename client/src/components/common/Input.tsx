import React, { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, icon, className, helperText, required, ...rest }, ref) => {
    const id = name || rest.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            name={name}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm 
              placeholder-gray-400 
              focus:outline-none focus:ring-primary-500 focus:border-primary-500 
              disabled:bg-gray-100 disabled:text-gray-500
              sm:text-sm 
              ${icon ? 'pl-10' : ''} 
              ${className || ''} 
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
            `.trim()}
            {...rest}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
