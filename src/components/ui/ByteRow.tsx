import React from 'react';
import { motion } from 'motion/react';

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
  activeColor = '#1E6FA8',
  className = '',
  animatedIndex = null,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 rounded-[4px]',
    md: 'w-6 h-6 rounded-[6px]',
    lg: 'w-8 h-8 rounded-[8px]',
  };

  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-[#E8E1D5]/60 border border-[#E8E1D5] ${className}`}
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
              isFilled ? '' : 'bg-[#DCD4C7] border border-[#CFC5B6]'
            }`}
            style={{
              backgroundColor: isFilled ? activeColor : undefined,
              borderColor: isFilled ? undefined : undefined,
            }}
            initial={false}
            animate={
              isJustFilled
                ? {
                    scale: [1, 1.25, 1],
                    rotate: [0, 6, -6, 0],
                  }
                : { scale: 1 }
            }
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {isFilled && (
              <div className="absolute inset-0 bg-white/20 rounded-[inherit] pointer-events-none" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
