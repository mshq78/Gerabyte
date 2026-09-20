import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Touch targets >= 48px, text-action scale
  const sizeClasses = {
    sm: 'min-h-[48px] px-4 text-action',
    md: 'min-h-[48px] h-12 px-6 text-action',
    lg: 'min-h-[56px] h-14 px-8 text-action',
  };

  // Tactile 4px darker bottom edge that compresses on active press
  const variantClasses = {
    primary:
      'bg-primary text-surface border-b-4 border-ink active:border-b-0 active:translate-y-1 hover:bg-primary-dark',
    secondary:
      'bg-surface text-ink border border-sunken-dark border-b-4 border-b-sunken-darker active:border-b-0 active:translate-y-1 hover:bg-paper',
    accent:
      'bg-coin text-ink border-b-4 border-coin-dark active:border-b-0 active:translate-y-1 hover:bg-coin-dark',
    success:
      'bg-success text-surface border-b-4 border-success-dark active:border-b-0 active:translate-y-1 hover:bg-success-dark',
    danger:
      'bg-danger text-surface border-b-4 border-danger-dark active:border-b-0 active:translate-y-1 hover:bg-danger-dark',
    ghost: 'bg-transparent text-ink hover:bg-sunken/60 active:bg-sunken transition-colors',
    outline:
      'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors',
  };

  const disabledClasses =
    disabled || isLoading
      ? 'opacity-50 cursor-not-allowed pointer-events-none active:translate-y-0 active:border-b-4'
      : 'cursor-pointer transition-all duration-75';

  return (
    <button
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2.5 rounded-tile select-none text-center whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${disabledClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-action">لطفاً منتظر بمانید...</span>
        </span>
      ) : (
        <>
          {leftIcon && (
            <span className="shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="shrink-0" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
