import { Card, type CardProps } from './Card';

/**
 * Tailwind translation of the Chakra-era `GlassCard` referenced in
 * skills/FRONTEND.md and agents/frontend-agent.md's component rules —
 * a thin alias over `Card` with the `glass` variant so existing call
 * sites (`<GlassCard>...</GlassCard>`) keep working.
 */
export function GlassCard(props: Omit<CardProps, 'variant'>) {
  return <Card variant="glass" {...props} />;
}
