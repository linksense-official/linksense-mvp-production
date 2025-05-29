'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  onClick,
  type = 'button'
}) => {
  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 text-white hover:bg-red-700 border-red-600';
      case 'outline':
        return 'bg-transparent text-gray-900 border-gray-300 hover:bg-gray-50';
      case 'secondary':
        return 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-100';
      case 'ghost':
        return 'bg-transparent text-gray-900 hover:bg-gray-100 border-transparent';
      case 'link':
        return 'bg-transparent text-blue-600 hover:text-blue-700 border-transparent underline';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'icon':
        return 'p-2';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses(variant)} ${getSizeClasses(size)} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;