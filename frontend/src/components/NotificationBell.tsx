import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, CheckCheck } from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  data?: { jobId?: string; stage?: string };
  is_read: boolean;
  created_at: string;
}

interface NotificationList {
  items: Notification[];
  unread: number;
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<ApiEnvelope<NotificationList>>('/notifications')).data.data,
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => (await api.post(`/notifications/${id}/read`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => (await api.post('/notifications/read-all')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    const onNotification = (notification: Notification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      if (user.role === 'professional') {
        qc.invalidateQueries({ queryKey: ['applications', 'me'] });
      }
      if (user.role === 'organization') {
        qc.invalidateQueries({ queryKey: ['applications-inbox'] });
        qc.invalidateQueries({ queryKey: ['job-applications'] });
      }

      toast(notification.title, {
        description: notification.body ?? undefined,
        duration: 6000,
      });
    };

    socket.on('notification:new', onNotification);
    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [user, qc]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        className="relative text-slate-600"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length ? (
              items.map((n) => {
                const jobLink = n.data?.jobId ? `/jobs/${n.data.jobId}` : null;
                const className = `block w-full border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  !n.is_read ? 'bg-primary/5' : ''
                }`;

                const handleOpen = () => {
                  if (!n.is_read) markRead.mutate(n.id);
                  setOpen(false);
                };

                return jobLink ? (
                  <Link key={n.id} to={jobLink} className={className} onClick={handleOpen}>
                    <NotificationContent notification={n} />
                  </Link>
                ) : (
                  <button key={n.id} type="button" className={className} onClick={handleOpen}>
                    <NotificationContent notification={n} />
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({ notification: n }: { notification: Notification }) {
  return (
    <>
      <p className="text-sm font-medium text-foreground">{n.title}</p>
      {n.body && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>}
      <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
    </>
  );
}
