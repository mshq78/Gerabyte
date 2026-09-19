import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ByteRowProps {
  total?: number;
  completed: number;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  className?: string;
  animatedIndex?: number | null;
}

export const ByteRow: React.FC<ByteRowProps> = ({
  total = 8,
  completed,
  size = 'md',
  activeColor = 'var(--color-primary)',
  className = '',
  animatedIndex = null,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-4 h-4 rounded-xs',
    md: 'w-6 h-6 rounded-xs',
    lg: 'w-8 h-8 rounded-sm',
  };

  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-tile bg-sunken/60 border border-sunken ${className}`}
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      {segments.map((index) => {
        const isFilled = index < completed;
        const isJustFilled = animatedIndex === index;

        return (
          <motion.div
            key={index}
            className={`${sizeClasses[size]} relative transition-colors duration-200 ${
              isFilled ? '' : 'bg-sunken-dark border border-sunken-darker'
            }`}
            style={{
              backgroundColor: isFilled ? activeColor : undefined,
            }}
            initial={false}
            animate={
              !shouldReduceMotion && isJustFilled
                ? {
                    scale: [1, 1.25, 1],
                    rotate: [0, 6, -6, 0],
                  }
                : { scale: 1 }
            }
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {isFilled && (
              <div className="absolute inset-0 bg-surface/20 rounded-[inherit] pointer-events-none" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
