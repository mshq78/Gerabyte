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
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm font-medium',
    md: 'h-12 px-6 text-base font-semibold',
    lg: 'h-14 px-8 text-lg font-bold',
  };

  // Tactile 4px darker bottom edge that compresses on active press
  const variantClasses = {
    primary:
      'bg-[#1E6FA8] text-white border-b-4 border-[#0D3F6B] active:border-b-0 active:translate-y-1 hover:bg-[#1A6295]',
    secondary:
      'bg-[#FFFFFF] text-[#0D3F6B] border border-[#DCD4C7] border-b-4 border-b-[#CFC5B6] active:border-b-0 active:translate-y-1 hover:bg-[#FAF8F5]',
    accent:
      'bg-[#F2A93B] text-[#0D3F6B] border-b-4 border-[#C7821B] active:border-b-0 active:translate-y-1 hover:bg-[#EAA032]',
    success:
      'bg-[#2E9E6B] text-white border-b-4 border-[#1E744D] active:border-b-0 active:translate-y-1 hover:bg-[#288D5E]',
    danger:
      'bg-[#D5483F] text-white border-b-4 border-[#9C2D25] active:border-b-0 active:translate-y-1 hover:bg-[#C23C34]',
    ghost:
      'bg-transparent text-[#0D3F6B] hover:bg-[#E8E1D5]/60 active:bg-[#E8E1D5] transition-colors',
    outline:
      'bg-transparent border-2 border-[#1E6FA8] text-[#1E6FA8] hover:bg-[#1E6FA8]/10 active:bg-[#1E6FA8]/20 transition-colors',
  };

  const disabledClasses = disabled || isLoading
    ? 'opacity-50 cursor-not-allowed pointer-events-none active:translate-y-0 active:border-b-4'
    : 'cursor-pointer transition-all duration-75';

  return (
    <button
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2.5 rounded-xl select-none text-center whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FA8] focus-visible:ring-offset-2 ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${disabledClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>لطفاً منتظر بمانید...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
