import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard for the staff-facing app. Shows a loading state while the
 * session is being resolved (token present but `/auth/me` still in flight),
 * redirects unauthenticated users to /login, and — since a member can log
 * in too — sends a member actor to their own portal instead of the staff UI,
 * even if they navigate here directly by URL.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.actor === 'member') {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}

/**
 * Route guard for the member self-service portal — the mirror image of
 * `ProtectedRoute`: sends a staff actor back to the staff dashboard instead
 * of the member-only portal.
 */
export function MemberProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.actor !== 'member') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
