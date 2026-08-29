import type { ChangeEvent } from 'react';
import { cn } from '../../lib/cn';
import type { AdminRole } from '../../types/admin';

const ROLE_OPTIONS: AdminRole[] = ['owner', 'admin', 'staff', 'trainer'];

interface RoleSelectorProps {
  value: AdminRole;
  onChange: (role: AdminRole) => void;
  disabled?: boolean;
  className?: string;
}

/** A native select for choosing a staff member's role, styled to match the design system's inputs. */
export function RoleSelector({ value, onChange, disabled = false, className }: RoleSelectorProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as AdminRole);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label="Role"
      className={cn(
        'h-9 rounded-lg border-2 border-border bg-transparent px-3 text-sm capitalize outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role} className="capitalize">
          {role}
        </option>
      ))}
    </select>
  );
}
