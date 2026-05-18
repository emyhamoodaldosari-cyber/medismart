import { supabase } from '@/lib/supabase';
import type { Chat, ChatMessage } from '@/types';

export async function getUserChat(userId: string): Promise<Chat | null> {
  const { data, error } = await supabase.from('chats').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function createChat(userId: string, pharmacistUserId?: string): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, pharmacist_user_id: pharmacistUserId ?? null, status: 'open' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function sendChatMessage(chatId: string, senderUserId: string, message: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ chat_id: chatId, sender_user_id: senderUserId, message })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
