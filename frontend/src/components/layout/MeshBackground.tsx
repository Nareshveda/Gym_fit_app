import { FloatingGymIcons } from './FloatingGymIcons';

/**
 * Ambient gradient-blob background for landing/auth pages, plus a scatter
 * of drifting multi-color gym icons. Purely decorative and non-interactive
 * — sits behind content via -z-10.
 */
export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-pulse rounded-full bg-secondary/20 blur-3xl" />
      <FloatingGymIcons />
    </div>
  );
}
