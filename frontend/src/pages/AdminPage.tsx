import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import type { AdminStats } from '../types/admin';

/** Roles permitted to view admin data; enforcement is server-side via `require_role`. */
const ADMIN_PANEL_ROLES = new Set(['owner', 'admin']);

export default function AdminPage() {
  const { user } = useAuth();
  // `user.role` is typed against the shared `Role` union, which (outside
  // this module's ownership) does not include "owner" — compare as a
  // plain string rather than narrowing against that union.
  const role = user ? (user.role as string) : undefined;
  const hasAdminAccess = role !== undefined && ADMIN_PANEL_ROLES.has(role);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAdminAccess) {
      setIsLoading(false);
      return;
    }
    adminService
      .getStats()
      .then(setStats)
      .catch(() => setError('Failed to load admin stats.'))
      .finally(() => setIsLoading(false));
  }, [hasAdminAccess]);

  if (!hasAdminAccess) {
    return (
      <PageWrapper>
        <TextReveal as="h1" className="mb-6 text-2xl">
          Admin
        </TextReveal>
        <GlassCard>
          <p className="text-muted-foreground">
            You do not have permission to view this page. Contact an owner or admin.
          </p>
        </GlassCard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Admin
        </TextReveal>
        <Link to="/admin/users">
          <Button variant="gradient">Manage Staff</Button>
        </Link>
      </div>

      <GlassCard>
        {isLoading && <p className="text-muted-foreground">Loading stats...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {stats && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Total staff: <span className="font-semibold text-foreground">{stats.total_staff}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.by_role.map((entry) => (
                <Badge key={entry.role} variant="outline" className="capitalize">
                  {entry.role}: {entry.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </PageWrapper>
  );
}
