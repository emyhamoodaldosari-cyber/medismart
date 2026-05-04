'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Spinner from '@/components/Spinner';

export default function ChatPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(false);
  }, [user]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    setMessages((current) => [...current, { id: Date.now().toString(), sender: 'you', content: message }]);
    setMessage('');
  };

  if (authLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/60">
        <h1 className="text-3xl font-semibold text-slate-900">Chat with pharmacy</h1>
        <p className="mt-3 text-slate-600">Ask questions and receive updates in real time.</p>
      </div>
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Start a conversation with your pharmacy here.</div>
          ) : (
            messages.map((item) => (
              <div key={item.id} className={`rounded-3xl p-4 ${item.sender === 'you' ? 'bg-pharmacy-light text-slate-900' : 'bg-slate-100 text-slate-700'}`}>
                <p className="text-sm font-semibold">{item.sender === 'you' ? 'You' : 'Pharmacy'}</p>
                <p className="mt-2 text-sm leading-6">{item.content}</p>
              </div>
            ))
          )}
        </div>
        <form className="mt-6 flex gap-3" onSubmit={handleSubmit}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-pharmacy focus:ring-2 focus:ring-pharmacy/10"
          />
          <button type="submit" className="rounded-full bg-pharmacy px-6 py-3 text-sm font-semibold text-white hover:bg-pharmacy-dark">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
