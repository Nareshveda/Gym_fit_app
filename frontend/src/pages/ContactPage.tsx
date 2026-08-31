import { MapPin, Phone } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { MeshBackground } from '../components/layout/MeshBackground';
import { GlassCard } from '../components/ui/GlassCard';

const ADDRESS = 'Sunnambu Kolathur Main Rd, S.Kolathur, Anna Nagar, Kovilambakkam, Chennai, Tamil Nadu 600129';
const PHONE_DISPLAY = '+91 81489 96010';
const PHONE_TEL = '+918148996010';

// Corrected coordinates (the earlier resolved pair landed in the sea).
const MAP_LAT = 12.946102;
const MAP_LNG = 80.200399;
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}&z=16&output=embed`;
const MAP_LINK = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}`;

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <MeshBackground />
      <PublicNavbar />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Contact Us</h1>
        <p className="mb-10 text-muted-foreground">Visit us, call us, or find us on the map below.</p>

        <div className="grid gap-6 sm:grid-cols-2">
          <GlassCard className="flex items-start gap-4">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="mb-1 font-semibold text-foreground">Address</h2>
              <p className="text-sm text-muted-foreground">{ADDRESS}</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-start gap-4">
            <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="mb-1 font-semibold text-foreground">Phone</h2>
              <a href={`tel:${PHONE_TEL}`} className="text-sm text-primary hover:underline">
                {PHONE_DISPLAY}
              </a>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-6 overflow-hidden p-0">
          <iframe
            title="HSP location on Google Maps"
            src={MAP_EMBED_SRC}
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </GlassCard>
        <a
          href={MAP_LINK}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          Open in Google Maps
        </a>
      </main>
    </div>
  );
}
