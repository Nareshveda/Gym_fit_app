import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

const listVariants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/** Wraps a list of items with a staggered fade/slide-in animation. */
export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={listVariants}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
