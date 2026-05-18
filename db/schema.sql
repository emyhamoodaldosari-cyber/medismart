-- MediSmart Platform schema

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  password_hash text,
  role text not null default 'patient',
  preferred_language text not null default 'en',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  city text not null,
  district text not null,
  street text not null,
  building_no text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp_contact text,
  email text,
  city text,
  district text,
  street text,
  latitude numeric,
  longitude numeric,
  opening_time text,
  closing_time text,
  delivery_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists pharmacists (
  user_id uuid primary key references users(id) on delete cascade,
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  employee_code text not null unique
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null
);

create table if not exists medicines (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete set null,
  brand_name text not null,
  generic_name text not null,
  description text,
  dosage_form text,
  strength text,
  manufacturer text,
  image_url text,
  usage_instructions text,
  warnings text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists pharmacy_inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  quantity integer not null default 0,
  price numeric not null default 0,
  expiry_date date,
  in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  unique(pharmacy_id, medicine_id)
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now(),
  unique(cart_id, pharmacy_id, medicine_id)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  pharmacy_id uuid not null references pharmacies(id) on delete set null,
  address_id uuid references user_addresses(id) on delete set null,
  pharmacist_user_id uuid references users(id) on delete set null,
  order_type text not null default 'pickup',
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pharmacist_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  sender_user_id uuid not null references users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists saved_medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, medicine_id)
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  doctor_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medicine_id uuid not null references medicines(id) on delete cascade,
  dosage text,
  created_at timestamptz not null default now()
);
