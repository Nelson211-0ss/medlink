import { NotificationRepository } from '../repositories/notification.repository';

type Emitter = (userId: string, event: string, payload: unknown) => void;

export class NotificationService {
  private emit?: Emitter;

  constructor(private notifications: NotificationRepository) {}

  /** Wire the Socket.io emitter after the server starts. */
  setEmitter(emit: Emitter) {
    this.emit = emit;
  }

  async notify(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await this.notifications.create(data);
    this.emit?.(data.userId, 'notification:new', notification);
    return notification;
  }

  list(userId: string) {
    return this.notifications.listForUser(userId);
  }

  unreadCount(userId: string) {
    return this.notifications.unreadCount(userId);
  }

  markRead(id: string, userId: string) {
    return this.notifications.markRead(id, userId);
  }

  markAllRead(userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
