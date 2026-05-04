export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'patient' | 'pharmacist' | 'admin';
  preferred_language: 'en' | 'ar';
  is_active: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  title: string;
  city: string;
  district: string;
  street: string;
  building_no?: string;
  is_default: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone?: string;
  whatsapp_contact?: string;
  email?: string;
  city?: string;
  district?: string;
  street?: string;
  opening_time?: string;
  closing_time?: string;
  delivery_available: boolean;
  is_active: boolean;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
}

export interface Medicine {
  id: string;
  category_id: string;
  brand_name: string;
  generic_name: string;
  description?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  image_url?: string;
  usage_instructions?: string;
  warnings?: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  price: number;
  expiry_date?: string;
  in_stock: boolean;
}

export interface Cart {
  id: string;
  user_id: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  pharmacy?: Pharmacy;
  medicine?: Medicine;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  pharmacy_id: string;
  address_id?: string;
  pharmacist_user_id?: string;
  order_type: 'pickup' | 'delivery';
  status: string;
  notes?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Chat {
  id: string;
  user_id: string;
  pharmacist_user_id: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
}

export interface Prescription {
  id: string;
  user_id: string;
  doctor_name?: string;
  notes?: string;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id: string;
  dosage?: string;
}
