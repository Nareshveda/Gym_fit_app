import { MapPin, Phone } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
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
    <div className="min-h-screen bg-gray-100">
      <PublicNavbar />

      {/* Height-bounded to the viewport (minus the 4rem navbar) so the map
          and the address/phone cards fit on screen without scrolling. */}
      <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col px-6 py-6">
        <div className="mb-4 shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
          <p className="text-sm text-muted-foreground">Visit us, call us, or find us on the map below.</p>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[360px_1fr]">
          <div className="flex min-h-0 flex-col gap-6">
            <GlassCard className="flex flex-1 items-start gap-4 border border-black/10">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="mb-1 font-semibold text-foreground">Address</h2>
                <p className="text-sm text-muted-foreground">{ADDRESS}</p>
              </div>
            </GlassCard>
            <GlassCard className="flex flex-1 items-start gap-4 border border-black/10">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="mb-1 font-semibold text-foreground">Phone</h2>
                <a href={`tel:${PHONE_TEL}`} className="text-sm text-primary hover:underline">
                  {PHONE_DISPLAY}
                </a>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="flex min-h-0 flex-col overflow-hidden p-0">
            <iframe
              title="HSP location on Google Maps"
              src={MAP_EMBED_SRC}
              className="w-full flex-1"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 border-t border-border bg-card px-4 py-2 text-sm text-primary hover:underline"
            >
              Open in Google Maps
            </a>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
