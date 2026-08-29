import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { UserTable } from '../components/admin/UserTable';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import type { AdminRole, AdminUser } from '../types/admin';

/** Staff management page: lists all staff accounts with role/status controls. */
export default function AdminUsersPage() {
  const { user } = useAuth();
  const currentUserId = user ? Number(user.id) : null;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.listUsers();
      setUsers(data);
    } catch {
      setError('Failed to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const applyUpdate = useCallback(
    async (userId: number, payload: { role?: AdminRole; is_active?: boolean }) => {
      setSavingUserId(userId);
      setError(null);
      try {
        const updated = await adminService.updateUser(userId, payload);
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      } catch {
        setError('Failed to update this staff account. It may be protected from self-demotion.');
      } finally {
        setSavingUserId(null);
      }
    },
    [],
  );

  const handleRoleChange = useCallback(
    (userId: number, role: AdminRole) => {
      void applyUpdate(userId, { role });
    },
    [applyUpdate],
  );

  const handleToggleActive = useCallback(
    (userId: number, nextIsActive: boolean) => {
      void applyUpdate(userId, { is_active: nextIsActive });
    },
    [applyUpdate],
  );

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Staff Management
        </TextReveal>
        <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
          Back to Admin
        </Link>
      </div>

      <GlassCard>
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}
        {isLoading ? (
          <p className="text-muted-foreground">Loading staff accounts...</p>
        ) : (
          <UserTable
            users={users}
            currentUserId={currentUserId}
            savingUserId={savingUserId}
            onRoleChange={handleRoleChange}
            onToggleActive={handleToggleActive}
          />
        )}
      </GlassCard>
    </PageWrapper>
  );
}
