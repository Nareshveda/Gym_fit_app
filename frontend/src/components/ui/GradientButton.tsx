import { Button, type ButtonProps } from './Button';

/**
 * Tailwind translation of the Chakra-era `GradientButton` — an alias
 * over `Button` with the `gradient` variant so existing call sites
 * (`<GradientButton>...</GradientButton>`) keep working.
 */
export function GradientButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="gradient" {...props} />;
}
