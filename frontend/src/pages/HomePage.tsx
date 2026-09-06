import { motion } from 'framer-motion';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { GlassCard } from '../components/ui/GlassCard';

const highlights = [
  { title: 'Personal Training', body: 'One-on-one coaching built around your goals, tracked from day one.' },
  { title: 'Group Training', body: 'High-energy group sessions that keep momentum and community front and center.' },
  { title: 'Progress You Can See', body: 'Vitals logged at every check-in, charted so you can watch the trend, not just the number.' },
];

// One bold word per showcase slot, in order.
const showcaseWords = ['CONQUER', 'FORGE', 'UNLEASH', 'RISE'];

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
  return (
    <div className="min-h-screen bg-gray-100">
      <PublicNavbar />

      <main className="flex flex-col items-center gap-10 py-12 text-center">
        <motion.img
          src="/brand/hsp-logo-white.png"
          alt="HSP — Harisportsperformance — Move. Build. Sprint."
          className="-mt-4 w-full max-w-[180px] rounded-2xl shadow-xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Full page width — a plain block-level 100% avoids the 100vw-vs-scrollbar
            mismatch that a `left-1/2 + w-screen` full-bleed trick would introduce. */}
        <div className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4">
          {mediaShowcase.map((item, index) => {
            const word = showcaseWords[index];
            return (
              <div key={item.src || `placeholder-${index}`} className="group relative aspect-[3/5] w-full overflow-hidden rounded-2xl shadow-md">
                {item.src ? (
                  item.isVideo ? (
                    <video
                      src={item.src}
                      muted
                      autoPlay
                      loop
                      playsInline
                      aria-label={`Gym highlight video ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={item.src}
                      alt={`Gym highlight ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )
                ) : (
                  <div className="h-full w-full bg-gradient-brand" />
                )}

                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/80 to-transparent" />

                {word && (
                  <motion.span
                    className="absolute inset-x-2 top-3 whitespace-nowrap text-center font-black italic uppercase leading-none tracking-tight text-transparent"
                    style={{
                      fontSize: 'clamp(1.5rem, 6vw, 3.25rem)',
                      WebkitTextStroke: '2px white',
                    }}
                    initial={{ opacity: 0, y: -24, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.2, ease: 'easeOut' }}
                  >
                    {word}
                  </motion.span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 sm:grid-cols-3">
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
