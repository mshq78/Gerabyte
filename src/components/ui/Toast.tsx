import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  toast: {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const shouldReduceMotion = useReducedMotion();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  };

  const borders = {
    success: 'border-success/30 bg-surface text-ink',
    error: 'border-danger/30 bg-surface text-ink',
    info: 'border-primary/30 bg-surface text-ink',
  };

  return (
    <AnimatePresence>
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none safe-top">
        <motion.div
          key={toast.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
          className={`pointer-events-auto max-w-sm w-full p-4 rounded-tile shadow-xl border flex items-center gap-3 ${borders[toast.type]}`}
          role="alert"
        >
          {icons[toast.type]}
          <p className="text-body font-semibold leading-normal flex-1">{toast.message}</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
