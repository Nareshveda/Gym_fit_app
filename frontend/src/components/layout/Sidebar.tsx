import {
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';

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

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-6 md:flex">
      <div className="mb-8 px-3">
        <span className="text-lg font-bold text-gradient-brand">HSP Gym</span>
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
      </nav>
    </aside>
  );
}
