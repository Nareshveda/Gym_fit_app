import { LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link to="/">
          <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-8 w-auto rounded-md md:hidden" />
        </Link>
        <span className="text-sm font-bold text-amber-500">
          {user?.full_name ?? user?.email ?? 'Welcome'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
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
  );
}
