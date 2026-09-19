import React, { useEffect, ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[85vh]',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet Body with safe-bottom */}
          <motion.div
            className={`relative z-10 w-full max-w-[480px] bg-surface rounded-t-sheet shadow-2xl border-t border-sunken flex flex-col ${maxHeight} overflow-hidden safe-bottom`}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { y: '100%' }}
            animate={{ y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Grab handle */}
            <div className="pt-3 pb-1 flex justify-center cursor-grab shrink-0">
              <div className="w-12 h-1.5 rounded-pill bg-sunken-dark" />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-5 py-3 border-b border-sunken flex items-center justify-between shrink-0">
                <div>
                  {title && <h3 className="font-bold text-title text-ink leading-tight">{title}</h3>}
                  {subtitle && <p className="text-meta text-ink/70 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="min-h-[48px] min-w-[48px] p-2.5 rounded-tile text-ink/60 hover:text-ink hover:bg-sunken/60 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="بستن پنجره"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
