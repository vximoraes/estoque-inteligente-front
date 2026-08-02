'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  zIndex?: number;
  role?: string;
  'data-test'?: string;
  contentDataTest?: string;
}

export function ModalShell({
  isOpen,
  onClose,
  children,
  overlayClassName,
  contentClassName,
  zIndex,
  role,
  'data-test': dataTest,
  contentDataTest,
}: ModalShellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            'fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-black/20 backdrop-blur-sm',
            overlayClassName,
          )}
          style={zIndex ? { zIndex } : undefined}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          data-test={dataTest}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <motion.div
            className={cn(
              'bg-card rounded-sm border border-border w-full',
              contentClassName,
            )}
            onClick={(e) => e.stopPropagation()}
            role={role}
            data-test={contentDataTest}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 150, damping: 25 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
