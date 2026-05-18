import { supabase } from '@/lib/supabase';
import type { Order, OrderItem } from '@/types';

export async function listOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function placeOrder(order: {
  order_number: string;
  user_id: string;
  pharmacy_id: string;
  address_id?: string;
  order_type: 'pickup' | 'home_delivery';
  notes?: string;
  pharmacist_user_id?: string;
  items: Array<{ medicine_id: string; quantity: number; unit_price: number }>;
}): Promise<Order | null> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: order.order_number,
      user_id: order.user_id,
      pharmacy_id: order.pharmacy_id,
      address_id: order.address_id,
      order_type: order.order_type,
      status: 'pending',
      notes: order.notes,
      pharmacist_user_id: order.pharmacist_user_id,
    })
    .select('*')
    .single();

  if (orderError || !orderData) throw orderError ?? new Error('Failed to create order');

  const orderItems = order.items.map((item) => ({
    order_id: orderData.id,
    medicine_id: item.medicine_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const { error: itemError } = await supabase.from('order_items').insert(orderItems);
  if (itemError) throw itemError;

  return orderData;
}

export async function reorder(orderId: string): Promise<Order | null> {
  const { data: previous, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (orderError || !previous) throw orderError;

  const duplicateOrderNumber = `RF-${Date.now()}`;
  return placeOrder({
    order_number: duplicateOrderNumber,
    user_id: previous.user_id,
    pharmacy_id: previous.pharmacy_id,
    address_id: previous.address_id ?? undefined,
    order_type: previous.order_type as 'pickup' | 'delivery',
    notes: `Refill of ${previous.order_number}`,
    pharmacist_user_id: previous.pharmacist_user_id ?? undefined,
    items: [],
  });
}
