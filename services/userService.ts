import { supabase } from '@/lib/supabase';
import type { Address, User } from '@/types';

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select('*').single();
  if (error) throw error;
  return data ?? null;
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase.from('user_addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addAddress(userId: string, address: Omit<Address, 'id' | 'user_id'>): Promise<Address> {
  const payload = { ...address, user_id: userId };
  const { data, error } = await supabase.from('user_addresses').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateAddress(addressId: string, updates: Partial<Address>): Promise<Address> {
  const { data, error } = await supabase.from('user_addresses').update(updates).eq('id', addressId).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(addressId: string): Promise<void> {
  const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
  if (error) throw error;
}
