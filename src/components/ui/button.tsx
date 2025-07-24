import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 border-0',
    secondary: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border border-purple-500/30 backdrop-blur-sm',
    outline: 'border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 backdrop-blur-sm',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5 border-0',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 border-0',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 border-0'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={clsx(
        'relative rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      
      <span className={clsx(loading && 'opacity-70')}>
        {children}
      </span>
      
      {/* Shine effect for primary buttons */}
      {variant === 'primary' && !disabled && !loading && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
};
