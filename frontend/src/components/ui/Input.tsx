import { motion } from 'framer-motion';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';
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
}

/**
 * Base input primitive with a subtle focus animation. `label`/`error`
 * are optional so it also works as a bare styled input.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? (label ? generatedId : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          id={inputId}
          whileFocus={{ scale: 1.01 }}
          className={cn(
            'flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:border-destructive',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
