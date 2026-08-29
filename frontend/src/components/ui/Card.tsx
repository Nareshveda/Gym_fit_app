import { motion } from 'framer-motion';
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type CardVariant = 'default' | 'glass';

/** Native div event handlers that conflict with Framer Motion's own typings. */
type ConflictingHandlers =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, ConflictingHandlers> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card border border-border shadow-sm',
  glass: 'glass shadow-xl',
};

/**
 * Base card primitive. `variant="glass"` reproduces the old GlassCard
 * look (frosted, translucent) via Tailwind's backdrop-blur utilities.
 * Every card animates in and lifts slightly on hover per the project's
 * animation rules.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className={cn('rounded-2xl p-6', variantClasses[variant], className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4 flex flex-col gap-1', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 flex items-center gap-2', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
