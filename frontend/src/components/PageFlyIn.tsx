import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Re-mounts and plays fly-in when the route pathname changes. */
export function PageFlyIn({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className={cn('animate-fly-in', className)}>
      {children ?? <Outlet />}
    </div>
  );
}
