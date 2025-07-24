
import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700',
    outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
  };
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-xl font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
