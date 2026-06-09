import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const url = import.meta.env.VITE_SOCKET_URL || undefined;
  socket = io(url, {
    path: '/socket.io',
    autoConnect: false,
    auth: { token: useAuthStore.getState().accessToken },
    transports: ['websocket'],
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: useAuthStore.getState().accessToken };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}
