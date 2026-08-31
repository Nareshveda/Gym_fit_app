import { motion } from 'framer-motion';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Native input event handlers that conflict with Framer Motion's own typings. */
type ConflictingHandlers =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, ConflictingHandlers> {
  label?: string;
  error?: string;
  /** Rendered inside the input's left edge (e.g. a currency symbol). Named to avoid colliding with the native `prefix` HTML attribute. */
  leadingElement?: ReactNode;
}

/**
 * Base input primitive with a subtle focus animation. `label`/`error`
 * are optional so it also works as a bare styled input.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, leadingElement, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? (label ? generatedId : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingElement && (
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center">{leadingElement}</span>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            whileFocus={{ scale: 1.01 }}
            className={cn(
              'flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
              leadingElement && 'pl-8',
              error && 'border-destructive focus:border-destructive',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
