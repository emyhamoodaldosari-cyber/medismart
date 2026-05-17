import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, Phone, User, Check, MoreVertical, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Chat as ChatType, ChatMessage, Pharmacy } from '../types';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateTime } from '../utils/localization';

const Chat = () => {
  const { user, profile, isPharmacist } = useAuth();
  const { showToast } = useToast();
  const { language, direction, t } = useLanguage();
  const tc = (key: string, params?: Record<string, string | number>) => t(`customer.chat.${key}`, params);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<(ChatType & { pharmacy?: Pharmacy })[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const { data, error } = await supabase.from('pharmacies').select('*').eq('is_active', true).order('name');
        if (error) throw error;
        setPharmacies((data as Pharmacy[]) || []);
      } catch (err) {
        console.error('Error fetching pharmacies:', err);
      }
    };
    if (!isPharmacist) fetchPharmacies();
  }, [isPharmacist]);

  const fetchChats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('chats').select(`*, pharmacy:pharmacies(*)`).order('updated_at', { ascending: false });
      if (isPharmacist && profile?.pharmacy_id) {
        query = query.eq('pharmacy_id', profile.pharmacy_id);
      } else {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setChats((data as any[]) || []);
      if (data && data.length > 0 && !activeChat) setActiveChat(data[0].id);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      showToast(tc('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user, isPharmacist, profile?.pharmacy_id]);

  useRealtimeSubscription(
    `chats-${isPharmacist ? `pharmacy-${profile?.pharmacy_id}` : `user-${user?.id}`}`,
    [
      {
        table: 'chats',
        event: 'INSERT',
        filter: isPharmacist && profile?.pharmacy_id ? `pharmacy_id=eq.${profile.pharmacy_id}` : user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: fetchChats,
      },
      {
        table: 'chats',
        event: 'UPDATE',
        filter: isPharmacist && profile?.pharmacy_id ? `pharmacy_id=eq.${profile.pharmacy_id}` : user?.id ? `user_id=eq.${user.id}` : undefined,
        callback: (payload) => setChats((prev) => prev.map((item) => item.id === payload.new.id ? { ...item, ...payload.new } : item)),
      },
    ],
    !!user,
  );

  const fetchMessages = async () => {
    if (!activeChat) return;
    try {
      const { data, error } = await supabase.from('chat_messages').select('*').eq('chat_id', activeChat).order('sent_at', { ascending: true });
      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (activeChat) fetchMessages();
  }, [activeChat]);

  useRealtimeSubscription(
    `chat-messages-${activeChat}`,
    [
      {
        table: 'chat_messages',
        event: 'INSERT',
        filter: activeChat ? `chat_id=eq.${activeChat}` : undefined,
        callback: (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage]),
      },
      {
        table: 'chat_messages',
        event: 'UPDATE',
        filter: activeChat ? `chat_id=eq.${activeChat}` : undefined,
        callback: (payload) => setMessages((prev) => prev.map((item) => item.id === payload.new.id ? payload.new as ChatMessage : item)),
      },
    ],
    !!activeChat,
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase.from('chat_messages').insert([
        { chat_id: activeChat, sender_user_id: user.id, message: newMessage.trim(), is_read: false },
      ]);
      if (error) throw error;
      setNewMessage('');

      const chat = chats.find((item) => item.id === activeChat);
      if (chat) {
        const recipientId = isPharmacist ? chat.user_id : chat.pharmacist_user_id;
        if (recipientId) {
          await supabase.from('notifications').insert([
            {
              user_id: recipientId,
              title: tc('newMessageTitle'),
              body: tc('messageFrom', { name: profile?.full_name || 'MediSmart' }),
              type: 'message',
              related_entity_id: activeChat,
            },
          ]);
        }
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      showToast(err.message || tc('sendError'), 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const createNewChat = async (pharmacyId: string) => {
    if (!user) return;
    try {
      const pharmacy = pharmacies.find((item) => item.id === pharmacyId);
      if (!pharmacy) {
        showToast(tc('pharmacyNotFound'), 'error');
        return;
      }
      const { data, error } = await supabase.from('chats').insert([{ user_id: user.id, pharmacy_id: pharmacyId, status: 'active' }]).select(`*, pharmacy:pharmacies(*)`).single();
      if (error) throw error;
      setChats((prev) => [data as any, ...prev]);
      setActiveChat(data.id);
      showToast(tc('chatCreated', { name: pharmacy.name }), 'success');
    } catch (err: any) {
      console.error('Error creating chat:', err);
      showToast(err.message || tc('createError'), 'error');
    }
  };

  const escalateToWhatsApp = () => {
    const activePharmacy = chats.find((item) => item.id === activeChat)?.pharmacy;
    if (!activePharmacy?.whatsapp_contact) {
      showToast(tc('whatsappUnavailable'), 'warning');
      return;
    }
    const phoneNumber = activePharmacy.whatsapp_contact.replace(/\D/g, '');
    const message = tc('startConversationMessage', { name: activePharmacy.name });
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    showToast(tc('openingWhatsapp'), 'info');
  };

  if (!user) {
    return <div className="p-20 text-center" dir={direction}><p className="text-gray-500">{tc('loginRequired')}</p></div>;
  }

  const activePharmacy = chats.find((item) => item.id === activeChat)?.pharmacy;

  return (
    <div className="bg-gray-50/50 h-[calc(100vh-80px)] overflow-hidden" dir={direction}>
      <div className="container mx-auto h-full px-4 py-8">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-[#1f2f31]/5 h-full overflow-hidden flex">
          <div className="w-full lg:w-96 border-r border-gray-50 flex flex-col hidden lg:flex bg-white">
            <div className="p-8 border-b border-gray-50 flex justify-between items-end gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-1 block">{tc('title')}</span>
                <h2 className="text-3xl font-heading font-bold text-[#1f2f31] tracking-tight">{tc('title')}</h2>
              </div>
              {!isPharmacist && (
                <div className="relative group">
                  <button className="w-12 h-12 bg-[#099aa7] text-white rounded-2xl flex items-center justify-center hover:bg-[#088a96] transition-all shadow-lg shadow-[#099aa7]/10">
                    <Plus size={20} />
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-2xl p-4 hidden group-hover:block z-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{tc('selectPharmacy')}</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {pharmacies.length > 0 ? pharmacies.map((pharmacy) => (
                        <button key={pharmacy.id} onClick={() => createNewChat(pharmacy.id)} className="w-full text-left p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                          <div className="font-bold text-sm text-[#1f2f31]">{pharmacy.name}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{pharmacy.city}</div>
                        </button>
                      )) : <p className="text-[10px] text-gray-400">{tc('noPharmacies')}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8"><div className="w-8 h-8 border-4 border-[#099aa7] border-t-transparent rounded-full animate-spin" /></div>
              ) : chats.length > 0 ? (
                chats.map((chat) => (
                  <button key={chat.id} onClick={() => setActiveChat(chat.id)} className={`w-full p-5 rounded-[24px] flex items-center gap-5 transition-all text-left group ${activeChat === chat.id ? 'bg-[#099aa7] text-white shadow-xl shadow-[#099aa7]/20' : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center text-gray-400 group-hover:ring-[#099aa7]/20 transition-all text-sm font-bold uppercase">{chat.pharmacy?.name?.substring(0, 2) || 'PH'}</div>
                    <div className="flex-grow min-w-0">
                      <div className={`font-bold text-base truncate tracking-tight ${activeChat === chat.id ? 'text-white' : 'text-[#1f2f31]'}`}>{chat.pharmacy?.name || tc('unknownPharmacy')}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest truncate mt-1 ${activeChat === chat.id ? 'text-white/50' : 'text-gray-400'}`}>{chat.status}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4"><MessageSquare size={32} /></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{tc('noActiveChannels')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow flex flex-col bg-gray-50/20 relative">
            {activeChat ? (
              <>
                <div className="bg-white p-7 border-b border-gray-50 flex items-center justify-between relative z-10 gap-4 flex-wrap">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#099aa7]/5 flex items-center justify-center text-[#099aa7] border border-[#099aa7]/10"><User size={24} /></div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1f2f31] tracking-tight leading-none">{activePharmacy?.name || tc('unknownPharmacy')}</h3>
                      <div className="flex items-center text-[10px] text-[#099aa7] font-bold uppercase tracking-widest mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#099aa7] mr-2 animate-pulse" />
                        {t('common.secureConnection')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={escalateToWhatsApp} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20">
                      <Phone size={14} /> WhatsApp
                    </button>
                    <button className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-[#1f2f31] hover:bg-gray-50 rounded-xl transition-all border border-gray-100">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="text-gray-200 mb-4" size={48} />
                      <p className="text-gray-400 text-sm">{tc('noMessages')}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_user_id === user.id;
                      return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[70%] relative group">
                            <div className={`p-5 rounded-[28px] ${isMe ? 'bg-[#099aa7] text-white rounded-tr-none' : 'bg-white text-[#363f40] rounded-tl-none border border-gray-100 shadow-sm'} relative z-10`}>
                              <p className="text-[14px] leading-relaxed font-medium">{msg.message}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-2 text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-gray-400 justify-end' : 'text-gray-400'}`}>
                              <span>{formatDateTime(msg.sent_at, language)}</span>
                              {isMe && <Check size={10} className="text-[#099aa7]" />}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <div className="p-8 bg-white border-t border-gray-50 relative z-10">
                  <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                    <div className="relative flex-grow group">
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={tc('placeholder')} disabled={sendingMessage} className="w-full h-16 pl-8 pr-16 bg-gray-50 text-[#1f2f31] border-none rounded-[24px] focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold placeholder:text-gray-300 outline-none disabled:opacity-50" />
                      <button type="submit" disabled={sendingMessage || !newMessage.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#099aa7] text-white rounded-2xl flex items-center justify-center hover:bg-[#088a96] transition-all shadow-xl shadow-[#099aa7]/10 active:scale-95 disabled:opacity-50">
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-20">
                <div className="relative mb-10">
                  <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-gray-200"><MessageSquare size={56} strokeWidth={1} /></div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#099aa7] rounded-full border-4 border-white animate-bounce flex items-center justify-center text-white font-bold text-lg">+</div>
                </div>
                <h2 className="text-4xl font-heading font-bold text-[#1f2f31] tracking-tight mb-4">{tc('pharmacistPortal')}</h2>
                <p className="text-[#363f40] max-w-sm font-medium leading-relaxed mb-12 uppercase text-[10px] tracking-widest">{isPharmacist ? tc('waitingForCustomers') : tc('startConversation')}</p>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="chatGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" /></pattern></defs>
                <rect width="100%" height="100%" fill="url(#chatGrid)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
