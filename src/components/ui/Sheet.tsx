import React, { useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
            className="fixed inset-0 bg-[#0D3F6B]/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet Body */}
          <motion.div
            className={`relative z-10 w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl border-t border-[#E8E1D5] flex flex-col ${maxHeight} overflow-hidden`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {/* Grab handle */}
            <div className="pt-3 pb-1 flex justify-center cursor-grab shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-[#DCD4C7]" />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="px-5 py-3 border-b border-[#E8E1D5] flex items-center justify-between shrink-0">
                <div>
                  {title && <h3 className="font-bold text-lg text-[#0D3F6B] leading-tight">{title}</h3>}
                  {subtitle && <p className="text-xs text-[#0D3F6B]/70 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-[#E8E1D5]/60 transition-colors"
                  aria-label="بستن"
                >
                  <X className="w-5 h-5" />
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
