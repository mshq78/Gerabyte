import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
  accentColor = 'var(--color-primary)',
  label,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isDone = status === 'done';
  const isCurrent = status === 'available' || status === 'in_progress';
  const isLocked = status === 'locked';
  const isPaywalled = status === 'paywalled';

  // Size configuration (all >= 48px touch target)
  const nodeSize = isCertificate ? 'w-20 h-20' : isCheckpoint ? 'w-18 h-18' : 'w-16 h-16';
  const borderRadius = isCertificate ? 'rounded-[26px]' : isCheckpoint ? 'rounded-[22px]' : 'rounded-[20px]';

  // Squircle style
  return (
    <div className="flex flex-col items-center select-none group">
      <motion.button
        whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
        onClick={onClick}
        className={`relative ${nodeSize} ${borderRadius} flex items-center justify-center transition-all cursor-pointer shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40`}
        style={{
          backgroundColor: isDone
            ? 'var(--color-success)'
            : isCurrent
            ? accentColor
            : isPaywalled
            ? 'var(--color-domain-4)'
            : 'var(--color-sunken-dark)',
          borderColor: isCurrent ? 'var(--color-ink)' : 'transparent',
          borderWidth: isCurrent ? 3 : 0,
        }}
        aria-label={`گرابایت ${toFa(index)} - وضعیت: ${status}`}
      >
        {/* Subtle Pulse ring for current lesson */}
        {!shouldReduceMotion && isCurrent && (
          <span
            className={`absolute -inset-2 ${borderRadius} border-2 opacity-75 animate-ping pointer-events-none`}
            style={{ borderColor: accentColor }}
            aria-hidden="true"
          />
        )}

        {/* Squircle Node Inner Content */}
        {isDone ? (
          <Check className="w-8 h-8 text-surface stroke-[3]" aria-hidden="true" />
        ) : isCertificate ? (
          <div className="flex flex-col items-center justify-center text-surface" aria-hidden="true">
            <Award className="w-8 h-8 stroke-[2.5]" />
          </div>
        ) : isCheckpoint ? (
          <div className="flex flex-col items-center justify-center text-surface" aria-hidden="true">
            <Sparkles className="w-7 h-7 stroke-[2.5]" />
          </div>
        ) : isPaywalled ? (
          <div className="flex flex-col items-center justify-center text-surface" aria-hidden="true">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
        ) : isLocked ? (
          <Lock className="w-6 h-6 text-ink/50 stroke-[2.5]" aria-hidden="true" />
        ) : (
          <span className="text-surface font-black text-headline tracking-tight">
            {toFa(index)}
          </span>
        )}

        {/* Small bottom badge for duration / XP */}
        {!isLocked && (
          <span
            className="absolute -bottom-2.5 px-2 py-0.5 rounded-pill text-meta font-bold bg-surface text-ink shadow-xs border border-sunken whitespace-nowrap"
          >
            {isCertificate ? 'آزمون جامع' : isCheckpoint ? 'ارزیابی' : `${toFa(minutes)} د`}
          </span>
        )}
      </motion.button>

      {label && (
        <span className="mt-3.5 text-meta font-semibold text-ink text-center max-w-[130px] line-clamp-1 leading-snug">
          {label}
        </span>
      )}
    </div>
  );
};
