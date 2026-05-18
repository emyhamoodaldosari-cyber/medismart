import { supabase } from '@/lib/supabase';
import type { Cart, CartItem } from '@/types';

export async function getCartForUser(userId: string): Promise<Cart | null> {
  const { data, error } = await supabase.from('carts').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function ensureCart(userId: string, pharmacyId?: string): Promise<Cart> {
  const existing = await getCartForUser(userId);
  if (existing) {
    if (pharmacyId && existing.pharmacy_id !== pharmacyId) {
      const { data, error } = await supabase.from('carts').update({ pharmacy_id: pharmacyId }).eq('id', existing.id).select('*').single();
      if (error) throw error;
      return data;
    }
    return existing;
  }

  const { data, error } = await supabase.from('carts').insert({ user_id: userId, pharmacy_id: pharmacyId ?? null }).select('*').single();
  if (error) throw error;
  return data;
}

export async function getCartItems(cartId: string): Promise<Array<CartItem & { medicine?: { brand_name: string }; pharmacy?: { name: string } }>> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, medicines(brand_name), pharmacies(name)')
    .eq('cart_id', cartId);
  if (error) throw error;
  return data ?? [];
}

export async function addToCart(cartId: string, pharmacyId: string, medicineId: string, quantity = 1, unitPrice = 0): Promise<void> {
  const { error } = await supabase.from('cart_items').upsert({ cart_id: cartId, pharmacy_id: pharmacyId, medicine_id: medicineId, quantity, unit_price: unitPrice }, { onConflict: 'cart_id,pharmacy_id,medicine_id' });
  if (error) throw error;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
  if (error) throw error;
}

export async function removeCartItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
  if (error) throw error;
}
