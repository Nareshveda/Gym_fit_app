import { motion } from 'framer-motion';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { MeshBackground } from '../components/layout/MeshBackground';
import { GlassCard } from '../components/ui/GlassCard';

const highlights = [
  { title: 'Personal Training', body: 'One-on-one coaching built around your goals, tracked from day one.' },
  { title: 'Group Training', body: 'High-energy group sessions that keep momentum and community front and center.' },
  { title: 'Progress You Can See', body: 'Vitals logged at every check-in, charted so you can watch the trend, not just the number.' },
];

// One bold word per showcase slot, in order — vivid gradient + glow color pair each.
const showcaseWords = [
  { text: 'GRIND', gradient: 'from-orange-400 via-red-500 to-yellow-400', glow: '#fb923c' },
  { text: 'LIFT', gradient: 'from-fuchsia-500 via-purple-500 to-indigo-400', glow: '#c026d3' },
  { text: 'HUSTLE', gradient: 'from-lime-400 via-emerald-400 to-cyan-400', glow: '#34d399' },
  { text: 'RISE', gradient: 'from-pink-500 via-rose-400 to-orange-400', glow: '#fb7185' },
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

        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {mediaShowcase.map((item, index) => {
            const word = showcaseWords[index];
            return (
              <div key={item.src || `placeholder-${index}`} className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-md">
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

                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/15 to-transparent" />

                {word && (
                  <motion.span
                    className={`animate-gradient-x animate-glow-pulse absolute inset-x-2 top-3 whitespace-nowrap bg-gradient-to-r bg-clip-text text-center font-black uppercase leading-none tracking-tight text-transparent ${word.gradient}`}
                    style={{ fontSize: 'clamp(1.5rem, 6vw, 3.25rem)', '--glow-color': word.glow } as React.CSSProperties}
                    initial={{ opacity: 0, y: -24, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.2, ease: 'easeOut' }}
                  >
                    {word.text}
                  </motion.span>
                )}
              </div>
            );
          })}
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
