import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins simple class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    const isActive = false;
    expect(cn('a', isActive && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('resolves conflicting Tailwind utilities in favor of the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
