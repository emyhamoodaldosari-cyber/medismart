-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_name text,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL,
  medicine_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id),
  CONSTRAINT cart_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id)
);
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pharmacy_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT carts_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_en text NOT NULL UNIQUE,
  name_ar text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT chat_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pharmacy_id uuid NOT NULL,
  pharmacist_user_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'active'::chat_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT chats_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id),
  CONSTRAINT chats_pharmacist_user_id_fkey FOREIGN KEY (pharmacist_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.medicines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  brand_name text NOT NULL,
  generic_name text NOT NULL,
  description text,
  dosage_form text,
  strength text,
  manufacturer text,
  image_url text,
  usage_instructions text,
  warnings text,
  requires_prescription boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_name_ar text,
  generic_name_ar text,
  description_ar text,
  image_storage_path text,
  CONSTRAINT medicines_pkey PRIMARY KEY (id),
  CONSTRAINT medicines_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.medicines_image_backup (
  id uuid,
  image_url text
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'system'::notification_type,
  related_entity_id uuid,
  metadata jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  medicine_id uuid,
  medicine_name text NOT NULL,
  dosage_form text,
  strength text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  total_price numeric NOT NULL CHECK (total_price >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  pharmacy_id uuid NOT NULL,
  address_id uuid,
  pharmacist_user_id uuid,
  prescription_id uuid UNIQUE,
  refill_of_order_id uuid,
  order_type USER-DEFINED NOT NULL DEFAULT 'pickup'::order_type,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0::numeric),
  delivery_fee numeric NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0::numeric),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0::numeric),
  notes text,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.user_addresses(id),
  CONSTRAINT orders_pharmacist_user_id_fkey FOREIGN KEY (pharmacist_user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_refill_of_order_id_fkey FOREIGN KEY (refill_of_order_id) REFERENCES public.orders(id),
  CONSTRAINT orders_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id)
);
CREATE TABLE public.pharmacies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  whatsapp_contact text,
  email USER-DEFINED UNIQUE,
  city text NOT NULL,
  district text,
  street text,
  latitude numeric,
  longitude numeric,
  opening_time time without time zone,
  closing_time time without time zone,
  delivery_available boolean NOT NULL DEFAULT true,
  delivery_fee numeric NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0::numeric),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pharmacies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pharmacy_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL,
  medicine_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price numeric NOT NULL CHECK (price >= 0::numeric),
  expiry_date date,
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  in_stock boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  last_updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pharmacy_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacy_inventory_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id),
  CONSTRAINT pharmacy_inventory_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id),
  CONSTRAINT pharmacy_inventory_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.prescription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL,
  medicine_id uuid,
  dosage text,
  quantity integer CHECK (quantity IS NULL OR quantity > 0),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prescription_items_pkey PRIMARY KEY (id),
  CONSTRAINT prescription_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id),
  CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id)
);
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pharmacy_id uuid,
  order_id uuid,
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  doctor_name text,
  notes text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::prescription_status,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT prescriptions_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id),
  CONSTRAINT prescriptions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id),
  CONSTRAINT prescriptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL DEFAULT ''::text,
  email USER-DEFINED NOT NULL UNIQUE,
  phone text,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  pharmacy_id uuid,
  preferred_language text NOT NULL DEFAULT 'en'::text CHECK (preferred_language = ANY (ARRAY['en'::text, 'ar'::text])),
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id)
);
CREATE TABLE public.saved_medicines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  medicine_id uuid NOT NULL,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_medicines_pkey PRIMARY KEY (id),
  CONSTRAINT saved_medicines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT saved_medicines_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id)
);
CREATE TABLE public.user_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  street text NOT NULL,
  building_no text,
  floor_no text,
  apartment_no text,
  landmark text,
  latitude numeric,
  longitude numeric,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);