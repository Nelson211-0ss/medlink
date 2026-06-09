import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, MessageSquare } from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { connectSocket } from '@/lib/socket';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, EmptyState } from '@/components/ui/misc';
import { cn, timeAgo } from '@/lib/utils';

interface Conversation {
  id: string;
  other_user_id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body?: string;
  created_at: string;
}

export default function Messages() {
  const user = useAuthStore((s) => s.user)!;
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () =>
      (await api.get<ApiEnvelope<Conversation[]>>('/messages/conversations')).data.data,
  });

  // Load messages when active conversation changes
  useEffect(() => {
    if (!active) return;
    const socket = connectSocket();
    socket.emit('conversation:join', active.id);
    api
      .get<ApiEnvelope<Message[]>>(`/messages/conversations/${active.id}/messages`)
      .then((res) => setMessages(res.data.data));
    api.post(`/messages/conversations/${active.id}/read`).catch(() => {});
    return () => {
      socket.emit('conversation:leave', active.id);
    };
  }, [active]);

  // Socket listeners
  useEffect(() => {
    const socket = connectSocket();
    const onNew = (msg: Message) => {
      if (msg.conversation_id === active?.id) setMessages((m) => [...m, msg]);
    };
    const onTyping = (p: { conversationId: string; userId: string; typing: boolean }) => {
      if (p.conversationId === active?.id && p.userId !== user.id) setTyping(p.typing);
    };
    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
    };
  }, [active, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim() || !active) return;
    const socket = connectSocket();
    socket.emit('message:send', { conversationId: active.id, body: text.trim() });
    setText('');
    socket.emit('typing:stop', active.id);
  };

  return (
    <div className="grid h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="overflow-y-auto">
        <div className="border-b p-4 font-semibold">Conversations</div>
        {conversations?.length ? (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={cn(
                'flex w-full items-center gap-3 border-b p-3 text-left transition-colors hover:bg-accent',
                active?.id === c.id && 'bg-accent',
              )}
            >
              <Avatar first={c.first_name} last={c.last_name} src={c.avatar} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {c.first_name} {c.last_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{c.last_message ?? 'No messages yet'}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {c.unread_count}
                </span>
              )}
            </button>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
        )}
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b p-4">
              <Avatar first={active.first_name} last={active.last_name} src={active.avatar} />
              <p className="font-semibold">
                {active.first_name} {active.last_name}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.sender_id === user.id ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                      m.sender_id === user.id
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted',
                    )}
                  >
                    <p>{m.body}</p>
                    <p className={cn('mt-1 text-[10px]', m.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {timeAgo(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {typing && <p className="text-xs italic text-muted-foreground">typing…</p>}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 border-t p-3">
              <Input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  connectSocket().emit('typing:start', active.id);
                }}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type a message..."
              />
              <Button size="icon" onClick={send}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-10 w-10" />}
            title="Select a conversation"
            description="Choose a conversation to start chatting in real time."
          />
        )}
      </Card>
    </div>
  );
}
