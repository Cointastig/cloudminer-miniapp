import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'mining' | 'success' | 'warning';
  showValue?: boolean;
  animated?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className,
  variant = 'default',
  showValue = false,
  animated = true
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variants = {
    default: {
      bg: 'bg-gray-700/50',
      fill: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/50'
    },
    mining: {
      bg: 'bg-gray-800/60 border border-cyan-500/20',
      fill: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
      glow: 'shadow-orange-500/50'
    },
    success: {
      bg: 'bg-gray-700/50',
      fill: 'bg-gradient-to-r from-green-500 to-emerald-600',
      glow: 'shadow-green-500/50'
    },
    warning: {
      bg: 'bg-gray-700/50',
      fill: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      glow: 'shadow-yellow-500/50'
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={clsx('relative', className)}>
      <div className={clsx(
        'relative w-full rounded-full overflow-hidden backdrop-blur-sm',
        currentVariant.bg
      )}>
        <motion.div
          className={clsx(
            'h-full rounded-full shadow-lg transition-all duration-300',
            currentVariant.fill,
            currentVariant.glow,
            animated && 'relative overflow-hidden'
          )}
          style={{ width: `${percentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Animated shine effect */}
          {animated && percentage > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 1
              }}
            />
          )}
          
          {/* Pulsing glow effect for mining variant */}
          {variant === 'mining' && percentage > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
        
        {/* Sparkle effects for high values */}
        {percentage > 80 && variant === 'mining' && (
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-2 h-2 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50"
            />
          </div>
        )}
      </div>
      
      {/* Value display */}
      {showValue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full ml-3 text-xs font-mono text-gray-400"
        >
          {percentage.toFixed(1)}%
        </motion.div>
      )}
    </div>
  );
};
