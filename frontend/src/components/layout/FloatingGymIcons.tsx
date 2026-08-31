import { motion } from 'framer-motion';

/** Flat, single-color gym-themed icons — simple enough to hand-author as inline SVG paths. */
function Dumbbell({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="22" width="12" height="20" rx="2" fill={color} />
      <rect x="50" y="22" width="12" height="20" rx="2" fill={color} />
      <rect x="14" y="28" width="6" height="8" fill={color} />
      <rect x="44" y="28" width="6" height="8" fill={color} />
      <rect x="19" y="29" width="26" height="6" rx="3" fill={color} />
    </svg>
  );
}

function Kettlebell({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 16a8 8 0 0 1 16 0v4h-16v-4Z"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="21" fill={color} />
    </svg>
  );
}

function Sneaker({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 44c0-6 4-10 10-12l14-6 8 6h10c6 0 10 4 10 10v4H6v-2Z" fill={color} />
      <rect x="6" y="46" width="52" height="7" rx="3.5" fill={color} />
    </svg>
  );
}

function Trophy({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10h24v14a12 12 0 0 1-24 0V10Z" fill={color} />
      <path
        d="M20 14h-8a2 2 0 0 0-2 2v2a10 10 0 0 0 10 10M44 14h8a2 2 0 0 1 2 2v2a10 10 0 0 1-10 10"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect x="28" y="36" width="8" height="10" fill={color} />
      <rect x="18" y="46" width="28" height="7" rx="2" fill={color} />
    </svg>
  );
}

function JumpRope({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="18" r="7" fill={color} />
      <circle cx="54" cy="18" r="7" fill={color} />
      <path
        d="M10 25c0 18 10 26 22 26s22-8 22-26"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WeightPlate({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill={color} />
      <circle cx="32" cy="32" r="10" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

function WaterBottle({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="4" width="20" height="8" rx="2" fill={color} />
      <path d="M20 12h24v8l4 6v30a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V26l4-6v-8Z" fill={color} />
    </svg>
  );
}

function Whistle({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="32" r="18" fill={color} />
      <rect x="38" y="26" width="20" height="12" rx="4" fill={color} />
      <circle cx="24" cy="32" r="6" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 4l7.5 18.5L59 24l-15 13 5 20-17-11-17 11 5-20-15-13 19.5-1.5L32 4Z"
        fill={color}
      />
    </svg>
  );
}

const icons = [Dumbbell, Kettlebell, Sneaker, Trophy, JumpRope, WeightPlate, WaterBottle, Whistle, Star];

// Vivid, varied colors — deliberately more saturated than the UI's own
// brand tokens so the floating shapes read as playful decoration, not
// interactive brand elements.
const colors = ['#f97316', '#a855f7', '#ec4899', '#22c55e', '#0ea5e9', '#eab308', '#ef4444', '#14b8a6'];

interface FloatingIconSpec {
  Icon: (typeof icons)[number];
  color: string;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  startRotate: number;
  swayRotate: number;
}

// Spreads shapes across the viewport using two different step sizes per
// axis (coprime-ish with 100) so the modulo pattern doesn't visibly repeat
// in a grid the way a single multiplier would.
function buildIcons(count: number): FloatingIconSpec[] {
  const specs: FloatingIconSpec[] = [];
  for (let i = 0; i < count; i++) {
    const startRotate = (i * 47) % 360;
    specs.push({
      Icon: icons[i % icons.length],
      color: colors[i % colors.length],
      top: `${(i * 29 + 5) % 92}%`,
      left: `${(i * 61 + 8) % 94}%`,
      size: 48 + ((i * 23) % 90),
      duration: 7 + (i % 6),
      delay: (i % 5) * 0.6,
      startRotate,
      swayRotate: i % 2 === 0 ? 12 : -12,
    });
  }
  return specs;
}

interface FloatingGymIconsProps {
  /** How many shapes to scatter. Fewer on busy data screens, more on marketing pages. */
  count?: number;
  /** Tailwind opacity class — lower on screens with dense text/tables. */
  opacityClassName?: string;
}

/**
 * Multi-color gym-themed shapes drifting gently in the background —
 * purely decorative, non-interactive, sits behind page content.
 */
export function FloatingGymIcons({ count = 18, opacityClassName = 'opacity-50' }: FloatingGymIconsProps) {
  const floatingIcons = buildIcons(count);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {floatingIcons.map(({ Icon, color, top, left, size, duration, delay, startRotate, swayRotate }, index) => (
        <motion.div
          key={index}
          className={opacityClassName}
          style={{
            position: 'absolute',
            top,
            left,
            width: size,
            height: size,
            rotate: startRotate,
            // A soft drop shadow keeps pale shapes readable against the
            // light, pastel-gradient background instead of washing out.
            filter: `drop-shadow(0 4px 8px ${color}66)`,
          }}
          animate={{ y: [0, -24, 0], rotate: [startRotate, startRotate + swayRotate, startRotate] }}
          transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon color={color} />
        </motion.div>
      ))}
    </div>
  );
}
