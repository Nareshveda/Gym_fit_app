import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type HeadlineTag = 'h1' | 'h2' | 'h3' | 'p';

interface TextRevealProps {
  children: ReactNode;
  as?: HeadlineTag;
  className?: string;
  delay?: number;
}

// Pre-created motion components (module scope) so identity is stable
// across renders — creating them inline would remount on every render.
const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
} as const;

/** Headline component that fades/slides up into view. Use for page titles. */
export function TextReveal({ children, as = 'h1', className, delay = 0 }: TextRevealProps) {
  const MotionTag = motionTags[as];
  return (
    <MotionTag
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn('font-bold tracking-tight', className)}
    >
      {children}
    </MotionTag>
  );
}
