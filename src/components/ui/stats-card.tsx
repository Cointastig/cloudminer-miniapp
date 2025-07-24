import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  animated?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  change,
  trend = 'neutral',
  className,
  animated = true
}) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const trendBg = {
    up: 'bg-green-500/10 border-green-500/20',
    down: 'bg-red-500/10 border-red-500/20',
    neutral: 'bg-gray-500/10 border-gray-500/20'
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.9 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      whileHover={{ scale: 1.02, y: -2 }}
      className={clsx(
        'relative p-4 rounded-xl backdrop-blur-sm border transition-all duration-200',
        trendBg[trend],
        'hover:shadow-lg hover:shadow-cyan-500/10',
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent" />
      
      {/* Content */}
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              className={clsx('p-2 rounded-lg', trendBg[trend])}
              whileHover={{ rotate: 5 }}
            >
              <div className={clsx('w-4 h-4', trendColors[trend])}>
                {icon}
              </div>
            </motion.div>
            <span className="text-sm text-gray-400 font-medium">{label}</span>
          </div>
          
          {/* Trend Indicator */}
          {change !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={clsx(
                'text-xs font-semibold px-2 py-1 rounded-full',
                trendBg[trend],
                trendColors[trend]
              )}
            >
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </motion.div>
          )}
        </div>

        {/* Value */}
        <motion.div
          key={value}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-mono font-bold text-white"
        >
          {value}
        </motion.div>

        {/* Animated Progress Bar */}
        {animated && (
          <div className="w-full h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full', {
                'bg-gradient-to-r from-green-400 to-emerald-500': trend === 'up',
                'bg-gradient-to-r from-red-400 to-pink-500': trend === 'down',
                'bg-gradient-to-r from-gray-400 to-gray-500': trend === 'neutral'
              })}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};
