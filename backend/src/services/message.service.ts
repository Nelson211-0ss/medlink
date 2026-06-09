import { MessageRepository } from '../repositories/message.repository';
import { NotificationService } from './notification.service';
import { ForbiddenError } from '../utils/errors';
import { NOTIFICATION_TYPES } from '../utils/constants';

export class MessageService {
  constructor(
    private messages: MessageRepository,
    private notifications: NotificationService,
  ) {}

  listConversations(userId: string) {
    return this.messages.listConversations(userId);
  }

  async startConversation(userId: string, otherUserId: string) {
    const id = await this.messages.getOrCreateConversation(userId, otherUserId);
    return { conversationId: id };
  }

  async listMessages(userId: string, conversationId: string, limit?: number, before?: string) {
    if (!(await this.messages.isParticipant(conversationId, userId))) {
      throw new ForbiddenError('Not a participant of this conversation');
    }
    return this.messages.listMessages(conversationId, limit, before);
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    body?: string,
    attachmentUrl?: string,
  ) {
    if (!(await this.messages.isParticipant(conversationId, userId))) {
      throw new ForbiddenError('Not a participant of this conversation');
    }
    const message = await this.messages.createMessage({
      conversationId,
      senderId: userId,
      body,
      attachmentUrl,
    });
    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.messages.markRead(conversationId, userId);
    return { read: true };
  }

  async notifyRecipient(recipientUserId: string, preview: string) {
    await this.notifications.notify({
      userId: recipientUserId,
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: 'New message',
      body: preview.slice(0, 120),
    });
  }

  isParticipant(conversationId: string, userId: string) {
    return this.messages.isParticipant(conversationId, userId);
  }
}
