import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicting utility classes
 * (e.g. `px-2` vs `px-4`) in favor of the last one provided.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
