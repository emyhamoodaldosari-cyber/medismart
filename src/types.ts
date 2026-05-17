/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * User role enum - matches database user_role type
 * These roles are immutable and set only by admins
 */
export type UserRole = 'customer' | 'pharmacist' | 'admin';

/**
 * User profile - read-only from database
 * Users cannot modify their own role
 */
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  pharmacy_id?: string; // For pharmacists only
  preferred_language?: 'en' | 'ar';
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Pharmacy information
 */
export interface Pharmacy {
  id: string;
  name: string;
  phone?: string;
  whatsapp_contact?: string;
  email?: string;
  city: string;
  district?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  opening_time?: string;
  closing_time?: string;
  delivery_available: boolean;
  delivery_fee: number;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Medicine information
 */
export interface Medicine {
  id: string;
  category_id?: string;
  brand_name: string;
  brand_name_ar?: string;
  generic_name: string;
  generic_name_ar?: string;
  description?: string;
  description_ar?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  image_url?: string;
  usage_instructions?: string;
  warnings?: string;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Pharmacy inventory item
 */
export interface InventoryItem {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  price: number;
  expiry_date?: string;
  low_stock_threshold: number;
  in_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  medicine?: Medicine;
  pharmacy?: Pharmacy;
}

/**
 * User address for orders
 */
export interface UserAddress {
  id: string;
  user_id: string;
  title: string;
  city: string;
  district: string;
  street: string;
  building_no?: string;
  floor_no?: string;
  apartment_no?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Order status enum - matches database order_status type
 */
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled' | 'rejected';

/**
 * Order type enum - matches database order_type type
 */
export type OrderType = 'pickup' | 'delivery';

/**
 * Order information
 */
export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  pharmacy_id: string;
  address_id?: string;
  pharmacist_user_id?: string;
  prescription_id?: string;
  refill_of_order_id?: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Order item (medicine in order)
 */
export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id?: string;
  medicine_name: string;
  dosage_form?: string;
  strength?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

/**
 * Prescription status enum - matches database prescription_status type
 */
export type PrescriptionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Prescription information
 */
export interface Prescription {
  id: string;
  user_id: string;
  pharmacy_id?: string;
  order_id?: string;
  storage_path: string;
  file_name?: string;
  mime_type?: string;
  doctor_name?: string;
  notes?: string;
  status: PrescriptionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Cart information
 */
export interface Cart {
  id: string;
  user_id: string;
  pharmacy_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Cart item
 */
export interface CartItem {
  id: string;
  cart_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
  // Relations
  medicine?: Medicine;
}

/**
 * Chat information
 */
export interface Chat {
  id: string;
  user_id: string;
  pharmacy_id: string;
  pharmacist_user_id?: string;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_user_id: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'system' | 'order' | 'message' | 'prescription';
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Contact message status
 */
export type ContactMessageStatus = 'pending' | 'read' | 'replied' | 'resolved';

/**
 * Contact message type
 */
export type ContactMessageType = 'general' | 'support' | 'feedback' | 'bug' | 'feature_request';

/**
 * Contact message
 */
export interface ContactMessage {
  id: string;
  user_id?: string; // Optional - user might not be logged in
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  message_type: ContactMessageType;
  status: ContactMessageStatus;
  admin_notes?: string;
  replied_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}
