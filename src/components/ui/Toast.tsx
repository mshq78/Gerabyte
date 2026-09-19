import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  toast: {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#2E9E6B] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#D5483F] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#1E6FA8] shrink-0" />,
  };

  const borders = {
    success: 'border-[#2E9E6B]/30 bg-white text-[#0D3F6B]',
    error: 'border-[#D5483F]/30 bg-white text-[#0D3F6B]',
    info: 'border-[#1E6FA8]/30 bg-white text-[#0D3F6B]',
  };

  return (
    <AnimatePresence>
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className={`pointer-events-auto max-w-sm w-full p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${borders[toast.type]}`}
          role="alert"
        >
          {icons[toast.type]}
          <p className="text-sm font-semibold leading-normal flex-1">{toast.message}</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
