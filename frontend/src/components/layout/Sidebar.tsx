import {
  Boxes,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Members', to: '/members', icon: Users },
  { label: 'Plans', to: '/plans', icon: CreditCard },
  { label: 'Payments', to: '/payments', icon: Wallet },
  { label: 'Attendance', to: '/attendance', icon: CalendarCheck },
  { label: 'Admin', to: '/admin', icon: Settings },
];

const ADMIN_ROLES = new Set(['owner', 'admin']);

export function Sidebar() {
  const { user } = useAuth();
  // `user.role` is typed against the shared `Role` union, which doesn't
  // include "owner" (see AdminPage.tsx for the same workaround) — compare
  // as a plain string rather than narrowing against that union.
  const role = user ? (user.role as string) : undefined;
  const isAdmin = role !== undefined && ADMIN_ROLES.has(role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-6 md:flex">
      <div className="mb-8 px-3">
        <Link to="/" aria-label="Go to Home">
          <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-10 w-auto rounded-md" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
              )
            }
          >
            <Boxes className="h-4 w-4" />
            Inventory
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
