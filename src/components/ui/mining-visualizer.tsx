import React from 'react';
import { motion } from 'framer-motion';
import { Hammer } from 'lucide-react';
import { Card, CardContent } from './card';

/**
 * A simplified mining visualizer component.
 *
 * The original implementation included a complex grid background,
 * energy beams and floating particles. To better fit a modern,
 * minimalist mining dashboard, this version focuses on a single,
 * glowing mining pickaxe. When mining is active the icon gently
 * pulses in scale, and a blurred coloured halo behind it provides
 * depth. The gradient colours can be passed via the `levelConfig`
 * prop to reflect the current miner level.
 */
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
  levelConfig
}) => {
  // Determine the gradient for the halo based on the provided level config.
  // The original `color` string uses Tailwind gradient utility classes
  // (e.g. 'from-cyan-400 to-blue-600'), which we convert into a
  // custom style. If no colour is provided we fall back to a cyan to
  // purple gradient.
  const gradient = levelConfig?.color || 'from-cyan-500 to-purple-600';

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8 flex items-center justify-center">
        <motion.div
          className="relative flex items-center justify-center w-40 h-40"
          animate={mining ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: mining ? Infinity : 0, ease: 'easeInOut' }}
        >
          {/* Glowing halo behind the icon */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${gradient} blur-3xl opacity-40`}
          />
          {/* Semi–transparent inner ring */}
          <div
            className={`absolute inset-4 rounded-full border-2 border-cyan-400/40`}
          />
          {/* Mining icon */}
          <Hammer className="relative z-10 w-16 h-16 text-white" />
        </motion.div>
      </CardContent>
    </Card>
  );
};
