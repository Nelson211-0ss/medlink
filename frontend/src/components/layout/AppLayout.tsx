import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  MessageSquare,
  FileText,
  User,
  Users,
  CreditCard,
  ShieldCheck,
  Building2,
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
import { PageFlyIn } from '@/components/PageFlyIn';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavSection {
  label?: string;
  roles?: Role[];
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/candidates', label: 'Find Talent', icon: Search },
      { to: '/applications', label: 'Applications', icon: FileText },
      { to: '/messages', label: 'Messages', icon: MessageSquare },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/billing', label: 'Billing', icon: CreditCard },
    ],
  },
  {
    label: 'Administration',
    roles: ['admin'],
    items: [
      { to: '/admin', label: 'Overview', icon: ShieldCheck, end: true },
      { to: '/admin/professionals', label: 'Professionals', icon: Users },
      { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
    ],
  },
];

const ORG_ONLY_PATHS = new Set(['/candidates']);

function SidebarNav({
  sections,
  role,
  onNavigate,
}: {
  sections: NavSection[];
  role?: Role;
  onNavigate: () => void;
}) {
  const visible = sections
    .filter((section) => !section.roles || (role && section.roles.includes(role)))
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !ORG_ONLY_PATHS.has(item.to) || role === 'organization' || role === 'admin',
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <nav className="app-sidebar-nav">
      {visible.map((section, index) => (
        <div key={section.label ?? `main-${index}`} className="app-sidebar-section">
          {section.label && <p className="app-sidebar-section-label">{section.label}</p>}
          <ul className="app-sidebar-list">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn('app-sidebar-link', isActive && 'app-sidebar-link--active')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'app-sidebar-link-icon',
                          isActive && 'app-sidebar-link-icon--active',
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="app-sidebar-link-label">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/login');
  };

  const closeSidebar = () => setOpen(false);

  return (
    <div className="min-h-screen bg-[hsl(var(--shell))] font-dashboard">
      <aside
        className={cn(
          'app-sidebar',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="app-sidebar-header">
          <Link to="/dashboard" onClick={closeSidebar} className="app-sidebar-brand">
            <Logo />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="app-sidebar-close lg:hidden"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <SidebarNav sections={NAV_SECTIONS} role={user?.role} onNavigate={closeSidebar} />

        <div className="app-sidebar-footer">
          {user && (
            <div className="app-sidebar-user">
              <Avatar
                first={user.firstName}
                last={user.lastName}
                src={user.avatar}
                className="h-9 w-9"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{titleCase(user.role)}</p>
              </div>
            </div>
          )}
          <button type="button" onClick={handleLogout} className="app-sidebar-signout">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="app-sidebar-backdrop lg:hidden" onClick={closeSidebar} aria-hidden />
      )}

      <div className="app-main">
        <header className="app-topbar">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="text-right">
                <p className="text-xs font-semibold leading-tight text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {titleCase(user?.role)}
                </p>
              </div>
              <Avatar
                first={user?.firstName}
                last={user?.lastName}
                src={user?.avatar}
                className="h-8 w-8"
              />
            </div>
          </div>
        </header>

        <main className="app-main-content">
          <PageFlyIn>
            <Outlet />
          </PageFlyIn>
        </main>
      </div>
    </div>
  );
}
