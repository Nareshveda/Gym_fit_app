import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import type { AdminUser, AdminRole } from '../../types/admin';
import { RoleSelector } from './RoleSelector';

interface UserTableProps {
  users: AdminUser[];
  currentUserId: number | null;
  savingUserId: number | null;
  exportingUserId: number | null;
  onRoleChange: (userId: number, role: AdminRole) => void;
  onToggleActive: (userId: number, nextIsActive: boolean) => void;
  onExportAttendance: (user: AdminUser) => void;
}

/** Staff management table: role selector + activate/deactivate + attendance report per row. */
export function UserTable({
  users,
  currentUserId,
  savingUserId,
  exportingUserId,
  onRoleChange,
  onToggleActive,
  onExportAttendance,
}: UserTableProps) {
  if (users.length === 0) {
    return <p className="text-muted-foreground">No staff accounts found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isSaving = savingUserId === user.id;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name}
                {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <RoleSelector
                  value={user.role}
                  disabled={isSaving}
                  onChange={(role) => onRoleChange(user.id, role)}
                />
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? 'success' : 'destructive'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSaving || isSelf}
                    onClick={() => onToggleActive(user.id, !user.is_active)}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportingUserId === user.id}
                    onClick={() => onExportAttendance(user)}
                  >
                    {exportingUserId === user.id ? 'Preparing…' : 'Attendance (PDF)'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
