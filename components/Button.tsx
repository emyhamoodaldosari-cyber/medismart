'use client';

import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-pharmacy/50',
        variant === 'primary' && 'bg-pharmacy text-white hover:bg-pharmacy-dark',
        variant === 'secondary' && 'bg-medical-blue text-pharmacy-dark hover:bg-slate-100',
        variant === 'outline' && 'border border-pharmacy text-pharmacy hover:bg-pharmacy/5',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
