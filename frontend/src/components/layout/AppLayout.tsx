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
  Bell,
} from 'lucide-react';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';
import { Avatar } from '../ui/misc';
import { cn } from '@/lib/utils';
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
    <div className="relative z-10 min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden text-sm text-muted-foreground lg:block">
            Welcome back, <span className="font-semibold text-foreground">{user?.firstName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Avatar first={user?.firstName} last={user?.lastName} src={user?.avatar} className="h-9 w-9" />
          </div>
        </header>

        <main className="container animate-fade-in py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
