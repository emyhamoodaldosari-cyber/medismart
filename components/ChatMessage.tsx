'use client';

interface ChatMessageProps {
  message: {
    sender_user_id: string;
    message: string;
    created_at: string;
  };
  currentUserId?: string;
}

export default function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  const isOwner = message.sender_user_id === currentUserId;

  return (
    <div className={isOwner ? 'self-end rounded-3xl bg-pharmacy text-white p-4 shadow' : 'self-start rounded-3xl bg-slate-100 p-4 shadow-sm'}>
      <p className="text-sm leading-6">{message.message}</p>
      <p className="mt-2 text-xs text-slate-500">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  );
}
