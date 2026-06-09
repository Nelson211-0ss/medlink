import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { verifyAccessToken } from '../utils/jwt';
import { container } from '../container';

interface AuthedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

const PRESENCE_KEY = 'presence:online';

export const initSockets = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    path: '/socket.io',
  });

  const { messageService } = container.services;

  // Wire notifications to push over sockets to a user's personal room.
  container.services.notificationService.setEmitter((userId, event, payload) => {
    io.to(`user:${userId}`).emit(event, payload);
  });

  // Auth handshake
  io.use((socket: AuthedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);
    await redis.sadd(PRESENCE_KEY, userId);
    socket.broadcast.emit('presence:update', { userId, online: true });
    logger.debug({ userId }, 'Socket connected');

    socket.on('presence:list', async (cb?: (ids: string[]) => void) => {
      const ids = await redis.smembers(PRESENCE_KEY);
      cb?.(ids);
    });

    socket.on('conversation:join', async (conversationId: string) => {
      if (await messageService.isParticipant(conversationId, userId)) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(
      'message:send',
      async (
        data: { conversationId: string; body?: string; attachmentUrl?: string },
        cb?: (res: unknown) => void,
      ) => {
        try {
          const message = await messageService.sendMessage(
            userId,
            data.conversationId,
            data.body,
            data.attachmentUrl,
          );
          io.to(`conversation:${data.conversationId}`).emit('message:new', message);
          cb?.({ success: true, message });
        } catch (err) {
          cb?.({ success: false, error: (err as Error).message });
        }
      },
    );

    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userId, typing: true });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userId, typing: false });
    });

    socket.on('message:read', async (conversationId: string) => {
      await messageService.markRead(userId, conversationId);
      io.to(`conversation:${conversationId}`).emit('message:read', { conversationId, readerId: userId });
    });

    socket.on('disconnect', async () => {
      await redis.srem(PRESENCE_KEY, userId);
      socket.broadcast.emit('presence:update', { userId, online: false });
      logger.debug({ userId }, 'Socket disconnected');
    });
  });

  return io;
};
