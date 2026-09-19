import React from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Sparkles, Award } from 'lucide-react';
import { toFa } from '../../lib/toFa';

interface SquircleNodeProps {
  index: number;
  status: 'done' | 'available' | 'in_progress' | 'locked' | 'paywalled';
  isCheckpoint?: boolean;
  isCertificate?: boolean;
  minutes?: number;
  xp?: number;
  onClick: () => void;
  accentColor?: string;
  label?: string;
}

export const SquircleNode: React.FC<SquircleNodeProps> = ({
  index,
  status,
  isCheckpoint = false,
  isCertificate = false,
  minutes = 3,
  xp = 10,
  onClick,
  accentColor = '#1E6FA8',
  label,
}) => {
  const isDone = status === 'done';
  const isCurrent = status === 'available' || status === 'in_progress';
  const isLocked = status === 'locked';
  const isPaywalled = status === 'paywalled';

  // Size configuration
  const nodeSize = isCertificate ? 'w-20 h-20' : isCheckpoint ? 'w-18 h-18' : 'w-16 h-16';
  const borderRadius = isCertificate ? 'rounded-[26px]' : isCheckpoint ? 'rounded-[22px]' : 'rounded-[20px]';

  // Squircle style
  return (
    <div className="flex flex-col items-center select-none group">
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        className={`relative ${nodeSize} ${borderRadius} flex items-center justify-center transition-all cursor-pointer shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E6FA8]/40`}
        style={{
          backgroundColor: isDone
            ? '#2E9E6B'
            : isCurrent
            ? accentColor
            : isPaywalled
            ? '#7A5BD6'
            : '#DCD4C7',
          borderColor: isCurrent ? '#0D3F6B' : 'transparent',
          borderWidth: isCurrent ? 3 : 0,
        }}
        aria-label={`گرابایت ${toFa(index)} - وضعیت: ${status}`}
      >
        {/* Subtle Pulse ring for current lesson */}
        {isCurrent && (
          <span
            className={`absolute -inset-2 ${borderRadius} border-2 opacity-75 animate-ping pointer-events-none`}
            style={{ borderColor: accentColor }}
          />
        )}

        {/* Squircle Node Inner Content */}
        {isDone ? (
          <Check className="w-8 h-8 text-white stroke-[3]" />
        ) : isCertificate ? (
          <div className="flex flex-col items-center justify-center text-white">
            <Award className="w-8 h-8 stroke-[2.5]" />
          </div>
        ) : isCheckpoint ? (
          <div className="flex flex-col items-center justify-center text-white">
            <Sparkles className="w-7 h-7 stroke-[2.5]" />
          </div>
        ) : isPaywalled ? (
          <div className="flex flex-col items-center justify-center text-white">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
        ) : isLocked ? (
          <Lock className="w-6 h-6 text-[#78716C] stroke-[2.5]" />
        ) : (
          <span className="text-white font-black text-xl tracking-tight">
            {toFa(index)}
          </span>
        )}

        {/* Small bottom badge for duration / XP */}
        {!isLocked && (
          <span
            className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0D3F6B] shadow-xs border border-[#E8E1D5] whitespace-nowrap"
          >
            {isCertificate ? 'آزمون جامع' : isCheckpoint ? 'ارزیابی' : `${toFa(minutes)} د`}
          </span>
        )}
      </motion.button>

      {label && (
        <span className="mt-3.5 text-xs font-semibold text-[#0D3F6B] text-center max-w-[130px] line-clamp-1 leading-snug">
          {label}
        </span>
      )}
    </div>
  );
};
