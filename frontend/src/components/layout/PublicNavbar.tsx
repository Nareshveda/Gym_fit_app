import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'bg-accent text-foreground' : 'text-muted-foreground',
  );

/** Top navigation for the public (unauthenticated) marketing pages. */
export function PublicNavbar() {
  const { isAuthenticated, user } = useAuth();
  const appHome = user?.actor === 'member' ? '/portal' : '/dashboard';

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <NavLink to="/" end>
            <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-9 w-auto rounded-md" />
          </NavLink>
          <nav className="hidden items-center gap-6 sm:flex">
            <NavLink to="/" end className={navLinkClasses}>
              Home
            </NavLink>
            <NavLink to="/services" className={navLinkClasses}>
              Services
            </NavLink>
            <NavLink to="/gallery" className={navLinkClasses}>
              Gallery
            </NavLink>
            <NavLink to="/about" className={navLinkClasses}>
              About
            </NavLink>
            <NavLink to="/contact" className={navLinkClasses}>
              Contact
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* WhatsApp quick contact button */}
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            aria-label="Contact us on WhatsApp"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-transform hover:scale-105"
            title="WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="currentColor" d="M20.52 3.48A11.95 11.95 0 0012 .5C6.21.5 1.5 5.21 1.5 11c0 1.93.5 3.8 1.46 5.44L1 23l6.87-1.77A11.5 11.5 0 0012 22.5c5.79 0 10.5-4.71 10.5-10.5 0-3-1.17-5.8-3.98-7.52zM12 20.5a9.5 9.5 0 01-4.86-1.36l-.35-.22-4.08 1.05 1.1-3.98-.23-.36A9.5 9.5 0 1112 20.5z" />
              <path fill="currentColor" d="M17.06 14.23c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.95 1.17c-.18.2-.36.22-.67.08a7.2 7.2 0 01-2.13-1.31c-.4-.36-.67-.8-.75-1.09-.08-.29-.01-.55.25-.72.25-.17.56-.43.83-.65.28-.22.37-.38.56-.63.18-.25.09-.47-.04-.62-.13-.15-.67-1.63-.92-2.24-.24-.58-.49-.5-.67-.51l-.57-.01c-.18 0-.47.07-.72.35-.25.28-.98.96-.98 2.34 0 1.38 1.01 2.72 1.15 2.91.14.2 1.98 3.22 4.8 4.51 2.82 1.29 3.23 1.07 3.82 1.01.59-.06 1.82-.74 2.08-1.45.26-.71.26-1.32.18-1.45-.08-.14-.29-.22-.59-.37z" />
            </svg>
          </a>

          <NavLink
            to={isAuthenticated ? appHome : '/login'}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-background shadow-md transition-shadow hover:shadow-lg hover:shadow-primary/20"
          >
            {isAuthenticated ? (user?.actor === 'member' ? 'My Portal' : 'Dashboard') : 'Sign In'}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
