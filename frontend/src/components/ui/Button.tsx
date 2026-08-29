import { motion } from 'framer-motion';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant =
  | 'default'
  | 'gradient'
  | 'outline'
  | 'ghost'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/** Native button event handlers that conflict with Framer Motion's own typings. */
type ConflictingHandlers =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  gradient:
    'bg-gradient-brand text-white shadow-md hover:shadow-lg hover:shadow-primary/20',
  outline:
    'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

/**
 * Base button primitive. Every variant carries hover/tap feedback via
 * Framer Motion, per the project's animation rules — use `variant="gradient"`
 * wherever the design calls for a primary/CTA action (the old GradientButton).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
