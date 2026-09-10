import React from 'react';
import { GradientButton } from '../components/ui/GradientButton';
import { PublicNavbar } from '../components/layout/PublicNavbar';

const ServiceCard: React.FC<{
  image: string;
  label: string;
  title: string;
  tagline: string;
  visualTagline?: string;
  cta: { text: string; href?: string };
  theme?: string;
}> = ({ image, label, title, tagline, visualTagline, cta, theme }) => {
  return (
    <section
      className={`relative flex-1 overflow-hidden rounded-2xl shadow-2xl bg-black`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden
      />

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative flex h-full min-h-[420px] flex-col items-start justify-center gap-4 p-8 text-left text-white">
        <span className="text-sm font-bold tracking-widest text-white/90">{label}</span>
        <h2 className="max-w-lg text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
        <p className="max-w-prose text-sm text-white/90">{tagline}</p>
        {visualTagline && (
          <p className="mt-2 text-sm italic text-white/80">{visualTagline}</p>
        )}

        <div className="mt-4">
          <GradientButton onClick={() => (window.location.href = cta.href || '#')}>{cta.text}</GradientButton>
        </div>
      </div>

      {/* Accent decoration */}
      {theme === 'group' && (
        <div className="absolute -right-10 -bottom-10 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 opacity-40 blur-3xl" />
      )}
      {theme === 'premium' && (
        <div className="absolute -left-10 -bottom-8 h-44 w-44 translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-br from-yellow-400 to-purple-700 opacity-30 blur-2xl" />
      )}
    </section>
  );
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase text-muted-foreground">Our Services</p>
          <h1 className="mt-3 text-4xl font-extrabold">Train smarter. Train together. Transform forever.</h1>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">Explore our group classes and premium personal coaching — built to fit every ambition.</p>
        </header>

        <main className="grid gap-8 md:grid-cols-2">
          <ServiceCard
            image="/assets/services-group.jpg"
            label="GROUP TRAINING"
            title={"Group’Dude — Train Together. Rise Together."}
            tagline={"High-energy group workouts, powerful motivation, and a community that keeps you moving. Sweat, laugh, push your limits, and grow stronger together."}
            visualTagline={"Group’Dude: \u201cMore people. More energy. More progress.\u201d"}
            cta={{ text: 'Join the Crew', href: '/register' }}
            theme="group"
          />

          <ServiceCard
            image="/assets/services-premium.jpg"
            label="PERSONAL COACHING"
            title={'Premium — Your Goal. Your Plan. Your Transformation.'}
            tagline={"Experience personalized coaching, tailored training, and focused support designed around your body, goals, and ambition. For those ready to go beyond ordinary."}
            visualTagline={"Premium: \u201cPrecision training for extraordinary goals.\u201d"}
            cta={{ text: 'Go Premium', href: '/contact' }}
            theme="premium"
          />
        </main>

      </div>
    </div>
  );
}
