import { supabase } from '../lib/supabase';
import {
  Medicine,
  InventoryItem,
  Order,
  UserProfile,
  Prescription,
  Cart,
  CartItem,
  OrderItem,
  UserAddress
} from '../types';

/**
 * MEDICINES & INVENTORY
 */

export const searchMedicines = async (query: string, categoryId?: string) => {
  let rpcQuery = supabase
    .from('pharmacy_inventory')
    .select(
      `
      *,
      medicine:medicines(*),
      pharmacy:pharmacies(*)
    `
    )
    .eq('in_stock', true)
    .gt('quantity', 0);

  if (categoryId) {
    rpcQuery = rpcQuery.eq('medicine.category_id', categoryId);
  }

  const { data, error } = await rpcQuery;

  if (error) throw error;

  if (query) {
    const lowerQuery = query.toLowerCase();
    const arabicQuery = query;
    
    return (data as InventoryItem[]).filter(
      (item) =>
        item.medicine?.brand_name.toLowerCase().includes(lowerQuery) ||
        item.medicine?.generic_name.toLowerCase().includes(lowerQuery) ||
        item.medicine?.description?.toLowerCase().includes(lowerQuery) ||
        item.medicine?.manufacturer?.toLowerCase().includes(lowerQuery) ||
        item.medicine?.dosage_form?.toLowerCase().includes(lowerQuery) ||
        item.medicine?.strength?.toLowerCase().includes(lowerQuery) ||
        item.medicine?.usage_instructions?.toLowerCase().includes(lowerQuery) ||
        item.medicine?.warnings?.toLowerCase().includes(lowerQuery) ||
        (item.medicine?.brand_name_ar && item.medicine.brand_name_ar.includes(arabicQuery)) ||
        (item.medicine?.generic_name_ar && item.medicine.generic_name_ar.includes(arabicQuery)) ||
        (item.medicine?.description_ar && item.medicine.description_ar.includes(arabicQuery))
    );
  }

  return (data as InventoryItem[]) || [];
};

export const getMedicineDetails = async (medicineId: string) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('id', medicineId)
    .single();

  if (error) throw error;
  return data as Medicine;
};

export const getInventoryItem = async (inventoryId: string) => {
  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .select(
      `
      *,
      medicine:medicines(*),
      pharmacy:pharmacies(*)
    `
    )
    .eq('id', inventoryId)
    .single();

  if (error) throw error;
  return data as InventoryItem;
};

/**
 * AUTH & PROFILES
 */

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
};

/**
 * ADDRESSES
 */

export const getUserAddresses = async (userId: string): Promise<UserAddress[]> => {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) throw error;
  return (data as UserAddress[]) || [];
};

export const createUserAddress = async (address: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('user_addresses')
    .insert([address])
    .select()
    .single();

  if (error) throw error;
  return data as UserAddress;
};

export const updateUserAddress = async (addressId: string, updates: Partial<UserAddress>) => {
  const { data, error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .single();

  if (error) throw error;
  return data as UserAddress;
};

/**
 * CART
 */

export const getOrCreateCart = async (userId: string, pharmacyId?: string): Promise<Cart> => {
  // Try to get existing cart
  let { data: cart, error: getError } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (getError && getError.code !== 'PGRST116') {
    throw getError;
  }

  // Create new cart if doesn't exist
  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert([{ 
        user_id: userId, 
        pharmacy_id: pharmacyId || null // Allow null, will be set when first item added
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newCart as Cart;
  }

  // Update pharmacy_id if provided and cart doesn't have one
  if (pharmacyId && !cart.pharmacy_id) {
    const { error: updateError } = await supabase
      .from('carts')
      .update({ pharmacy_id: pharmacyId })
      .eq('id', cart.id);

    if (updateError) throw updateError;
    cart.pharmacy_id = pharmacyId;
  }

  return cart as Cart;
};

export const getCartItems = async (cartId: string) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
      *,
      medicine:medicines(*)
    `
    )
    .eq('cart_id', cartId);

  if (error) throw error;
  return (data as CartItem[]) || [];
};

export const addToCart = async (cartId: string, medicineId: string, quantity: number, unitPrice: number) => {
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .eq('medicine_id', medicineId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity, unit_price: unitPrice, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as CartItem;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert([{ cart_id: cartId, medicine_id: medicineId, quantity, unit_price: unitPrice }])
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
};

export const updateCartItem = async (cartItemId: string, quantity: number) => {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
};

export const removeFromCart = async (cartItemId: string) => {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

  if (error) throw error;
};

/**
 * ORDERS
 */

export const placeOrder = async (
  orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<OrderItem, 'id' | 'created_at'>[]
) => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) throw itemsError;

  return order as Order;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Order[]) || [];
};

export const getOrderDetails = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        *,
        medicine:medicines(*)
      ),
      pharmacy:pharmacies(*),
      address:user_addresses(*)
    `
    )
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * PRESCRIPTIONS
 */

export const uploadPrescription = async (userId: string, file: File, notes?: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('prescriptions').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('prescriptions')
    .insert([
      {
        user_id: userId,
        storage_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        notes: notes || '',
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Prescription;
};

export const getUserPrescriptions = async (userId: string): Promise<Prescription[]> => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Prescription[]) || [];
};
