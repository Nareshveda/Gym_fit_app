import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { MeshBackground } from '../components/layout/MeshBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/useAuth';

const highlights = [
  { title: 'Personal Training', body: 'One-on-one coaching built around your goals, tracked from day one.' },
  { title: 'Group Training', body: 'High-energy group sessions that keep momentum and community front and center.' },
  { title: 'Progress You Can See', body: 'Vitals logged at every check-in, charted so you can watch the trend, not just the number.' },
];

// Drop up to 4 images/videos into src/assets/home-media/ and they show up here
// automatically after the next build — no code change needed. Files are shown
// in filename order, so prefix them (01-hero.jpg, 02-class.mp4, ...) to control
// the order. Supported: png/jpg/jpeg/webp/gif for images, mp4/webm for video.
const mediaFiles = import.meta.glob('../assets/home-media/*.{png,jpg,jpeg,webp,gif,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const mediaShowcase = Object.keys(mediaFiles)
  .sort()
  .slice(0, 4)
  .map((path) => ({
    src: mediaFiles[path],
    isVideo: /\.(mp4|webm)$/i.test(path),
  }));

while (mediaShowcase.length < 4) {
  mediaShowcase.push({ src: '', isVideo: false });
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  // Signing in navigates straight to the dashboard/portal (see LoginForm) —
  // this page is NOT force-redirected away for an authenticated visitor, so
  // clicking the logo from inside the app genuinely lands here instead of
  // bouncing straight back to where you started.
  const appHome = user?.actor === 'member' ? '/portal' : '/dashboard';

  return (
    <div className="min-h-screen">
      <MeshBackground />
      <PublicNavbar />

      <main className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-20 text-center">
        <motion.img
          src="/brand/hsp-logo-white.png"
          alt="HSP — Harisportsperformance — Move. Build. Sprint."
          className="w-full max-w-xs rounded-2xl shadow-xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Move. Build. <span className="text-gradient-brand">Sprint.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Harisportsperformance gym management — enrollment, attendance, vitals tracking, and
            fee management, all in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? appHome : '/login'}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-brand px-6 text-base font-semibold text-background shadow-md transition-shadow hover:shadow-lg hover:shadow-primary/20"
          >
            {isAuthenticated ? (user?.actor === 'member' ? 'Go to My Portal' : 'Go to Dashboard') : 'Sign In'}
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-input px-6 text-base font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Contact Us
          </Link>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {mediaShowcase.map((item, index) =>
            item.src ? (
              item.isVideo ? (
                <video
                  key={item.src}
                  src={item.src}
                  muted
                  autoPlay
                  loop
                  playsInline
                  aria-label={`Gym highlight video ${index + 1}`}
                  className="aspect-[3/4] w-full rounded-2xl object-cover shadow-md"
                />
              ) : (
                <img
                  key={item.src}
                  src={item.src}
                  alt={`Gym highlight ${index + 1}`}
                  className="aspect-[3/4] w-full rounded-2xl object-cover shadow-md"
                />
              )
            ) : (
              <div
                key={`placeholder-${index}`}
                className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-gradient-brand p-4 text-center text-sm font-medium text-background shadow-md"
              >
                {`Image / Video ${index + 1}`}
              </div>
            ),
          )}
        </div>

        <div className="mt-10 grid w-full gap-6 sm:grid-cols-3">
          {highlights.map((item) => (
            <GlassCard key={item.title} className="text-left">
              <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </GlassCard>
          ))}
        </div>
      </main>
    </div>
  );
}
