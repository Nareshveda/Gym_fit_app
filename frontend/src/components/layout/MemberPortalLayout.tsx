import { LogOut, User as UserIcon } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { FloatingGymIcons } from './FloatingGymIcons';

/**
 * Shell for the member self-service portal — deliberately minimal (no
 * Sidebar, no staff nav items) since a logged-in member only ever sees
 * this one page's worth of their own attendance/vitals.
 */
export function MemberPortalLayout() {
  const { user, logout } = useAuth();

  return (
    // No bg-background here — see AppLayout.tsx for why that would hide
    // FloatingGymIcons' fixed layer entirely.
    <div className="flex min-h-screen flex-col">
      <FloatingGymIcons count={12} opacityClassName="opacity-25" />
      <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur">
        <Link to="/" aria-label="Go to Home">
          <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-8 w-auto rounded-md" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-amber-500">{user?.full_name ?? 'Welcome'}</span>
          <Link
            to="/portal/profile"
            aria-label="View profile"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary transition-opacity hover:opacity-80"
          >
            {user?.avatar_url ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                alt="Your profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
