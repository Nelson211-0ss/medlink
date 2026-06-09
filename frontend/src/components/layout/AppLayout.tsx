import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  MessageSquare,
  FileText,
  User,
  CreditCard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '../Logo';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';
import { Avatar } from '../ui/misc';
import { cn, titleCase } from '@/lib/utils';
import { Role, useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useAuth';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/candidates', label: 'Find Talent', icon: Search, roles: ['organization', 'admin'] },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
];

export function AppLayout() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  const items = NAV.filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--shell))] font-dashboard">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-40 flex w-60 flex-col bg-[hsl(var(--sidebar))] shadow-lg transition-transform',
          'inset-y-0 left-0 lg:inset-y-auto lg:left-4 lg:top-4 lg:bottom-4 lg:rounded-2xl',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4 lg:rounded-t-2xl">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 p-2.5 lg:rounded-b-2xl">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col lg:pl-[calc(15rem+2rem)]">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between bg-[hsl(var(--shell))] px-4 sm:px-5 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="text-right">
                <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                  {titleCase(user?.role)}
                </p>
              </div>
              <Avatar first={user?.firstName} last={user?.lastName} src={user?.avatar} className="h-8 w-8" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-5 pt-1 sm:px-5 sm:pb-6 lg:px-6 lg:pb-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
