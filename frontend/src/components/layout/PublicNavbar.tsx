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
            <NavLink to="/contact" className={navLinkClasses}>
              Contact
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
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
