import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'gradient';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'glass',
  hover = true,
  className,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-white/10 backdrop-blur-md border border-white/20',
    glass: 'bg-black/20 backdrop-blur-xl border border-cyan-500/20 shadow-xl',
    solid: 'bg-gray-900 border border-gray-700',
    gradient: 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-purple-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      className={clsx(
        'rounded-2xl shadow-2xl transition-all duration-300',
        variants[variant],
        hover && 'hover:shadow-cyan-500/10',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx('px-6 pt-6 pb-0', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={clsx('text-lg font-semibold text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={clsx('text-sm text-gray-400 mt-1', className)} {...props}>
    {children}
  </p>
);
