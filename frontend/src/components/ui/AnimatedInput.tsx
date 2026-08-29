import { Input, type InputProps } from './Input';

/**
 * Tailwind translation of the Chakra-era `AnimatedInput` — `Input`
 * already carries the focus animation, so this is a naming alias for
 * call sites that reference `AnimatedInput` per skills/FRONTEND.md.
 */
export function AnimatedInput(props: InputProps) {
  return <Input {...props} />;
}
