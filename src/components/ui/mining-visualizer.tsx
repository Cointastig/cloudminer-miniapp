import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, HardDrive, Activity } from 'lucide-react';
import { Card, CardContent } from './card';

interface MiningVisualizerProps {
  mining: boolean;
  level: number;
  earned: number;
  levelConfig: {
    name: string;
    multiplier: number;
    color: string;
  };
}

export const MiningVisualizer: React.FC<MiningVisualizerProps> = ({
  mining,
  level,
  earned,
  levelConfig
}) => {
  // Generate mining particles
  const generateParticles = () => {
    return Array.from({ length: mining ? 8 : 0 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-cyan-400 rounded-full"
        initial={{ 
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          opacity: 0,
          scale: 0
        }}
        animate={{
          x: Math.random() * 400 - 200,
          y: Math.random() * 400 - 200,
          opacity: [0, 1, 0],
          scale: [0, 1, 0]
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "easeOut"
        }}
      />
    ));
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8">
        {/* Central Mining Core */}
        <div className="relative flex items-center justify-center h-48">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="border border-cyan-500/20"
                  animate={mining ? {
                    opacity: [0.1, 0.3, 0.1],
                    borderColor: ['rgba(34, 211, 238, 0.1)', 'rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.1)']
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: mining ? Infinity : 0,
                    delay: (i % 8) * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mining Core */}
          <motion.div
            className="relative z-10"
            animate={mining ? {
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            } : {}}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 10, repeat: Infinity, ease: "linear" }
            }}
          >
            {/* Core Circle */}
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${levelConfig.color} flex items-center justify-center shadow-2xl`}>
              <motion.div
                animate={mining ? { rotate: -360 } : {}}
                transition={{ duration: 3, repeat: mining ? Infinity : 0, ease: "linear" }}
              >
                <Cpu className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            {/* Energy Rings */}
            {mining && Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{
                  scale: [1, 2, 3],
                  opacity: [0.8, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>

          {/* Mining Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {generateParticles()}
          </div>

          {/* Energy Beams */}
          {mining && (
            <>
              {/* Horizontal Beam */}
              <motion.div
                className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                animate={{
                  opacity: [0, 1, 0],
                  scaleX: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Vertical Beam */}
              <motion.div
                className="absolute left-1/2 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
                animate={{
                  opacity: [0, 1, 0],
                  scaleY: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.75,
                  ease: "easeInOut"
                }}
              />
            </>
          )}
        </div>

        {/* Mining Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* Hash Rate */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center">
              <Activity className="w-4 h-4 text-cyan-400 mr-1" />
              <span className="text-xs text-gray-400">Hash Rate</span>
            </div>
            <motion.div
              key={level}
              initial={{ scale: 1.2, color: '#06b6d4' }}
              animate={{ scale: 1, color: '#e5e7eb' }}
              className="text-sm font-mono font-bold"
            >
              {(level * levelConfig.multiplier * 0.72).toFixed(1)} MH/s
            </motion.div>
          </div>

          {/* Power */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-xs text-gray-400">Power</span>
            </div>
            <motion.div
              animate={mining ? {
                color: ['#eab308', '#f59e0b', '#eab308']
              } : {}}
              transition={{ duration: 1, repeat: mining ? Infinity : 0 }}
              className="text-sm font-mono font-bold"
            >
              {mining ? `${(level * 45).toFixed(0)}W` : '0W'}
            </motion.div>
          </div>

          {/* Temperature */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-red-400 mr-1" />
              <span className="text-xs text-gray-400">Temp</span>
            </div>
            <motion.div
              animate={mining ? {
                color: ['#ef4444', '#f97316', '#ef4444']
              } : {}}
              transition={{ duration: 2, repeat: mining ? Infinity : 0 }}
              className="text-sm font-mono font-bold"
            >
              {mining ? `${(65 + level * 2).toFixed(0)}°C` : '25°C'}
            </motion.div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <motion.div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              mining 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
            animate={mining ? {
              boxShadow: [
                '0 0 10px rgba(34, 197, 94, 0.3)',
                '0 0 20px rgba(34, 197, 94, 0.5)',
                '0 0 10px rgba(34, 197, 94, 0.3)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: mining ? Infinity : 0 }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${mining ? 'bg-green-400' : 'bg-gray-400'}`}
              animate={mining ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: mining ? Infinity : 0 }}
            />
            <span>
              {mining ? 'MINING ACTIVE' : 'SYSTEM IDLE'}
            </span>
          </motion.div>
        </div>

        {/* Earnings Display */}
        <AnimatePresence>
          {earned > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-yellow-500/30"
            >
              <div className="text-xs text-yellow-400">Mined</div>
              <div className="text-sm font-mono font-bold text-yellow-300">
                +{earned.toFixed(3)} DTX
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
