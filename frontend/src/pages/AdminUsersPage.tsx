import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { UserTable } from '../components/admin/UserTable';
import { useAuth } from '../context/AuthContext';
import { downloadAttendancePdf } from '../lib/attendancePdf';
import { adminService } from '../services/adminService';
import { staffAttendanceService } from '../services/staffAttendanceService';
import type { AdminRole, AdminUser } from '../types/admin';

/** Staff management page: lists all staff accounts with role/status controls. */
export default function AdminUsersPage() {
  const { user } = useAuth();
  const currentUserId = user ? Number(user.id) : null;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [exportingUserId, setExportingUserId] = useState<number | null>(null);

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

  const handleExportAttendance = useCallback(async (targetUser: AdminUser) => {
    setExportingUserId(targetUser.id);
    setError(null);
    try {
      const records = await staffAttendanceService.list({ staffId: targetUser.id });
      downloadAttendancePdf({
        title: `Attendance Report — ${targetUser.full_name}`,
        subtitle: `Role: ${targetUser.role}`,
        rows: records.map((record) => ({
          date: record.date,
          checkIn: record.check_in_time,
          checkOut: record.check_out_time,
        })),
        fileName: `attendance-${targetUser.full_name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      });
    } catch {
      setError('Failed to export this attendance report.');
    } finally {
      setExportingUserId(null);
    }
  }, []);

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Staff Management
        </TextReveal>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/staff/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-background shadow-md transition-shadow hover:shadow-lg hover:shadow-primary/20"
          >
            Add Staff
          </Link>
          <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
            Back to Admin
          </Link>
        </div>
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
            exportingUserId={exportingUserId}
            onRoleChange={handleRoleChange}
            onToggleActive={handleToggleActive}
            onExportAttendance={(target) => void handleExportAttendance(target)}
          />
        )}
      </GlassCard>
    </PageWrapper>
  );
}
