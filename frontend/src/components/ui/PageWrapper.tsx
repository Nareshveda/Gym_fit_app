import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Every route's top-level element should be wrapped in this so pages
 * fade/slide in consistently, per the project's animation rules.
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={cn('min-h-screen', className)}
    >
      {children}
    </motion.div>
  );
}
