export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_ngn: number;
  image_id: string;
  tags?: ('Spicy' | 'Vegetarian' | 'Chef Choice' | 'Gluten-Free')[];
  available: boolean;
  featured: boolean;
  sort: number;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  sort: number;
}

export interface BusinessHours {
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  open: string;    // "11:00"
  close: string;   // "22:00" or "01:00"
  closed: boolean;
}

export interface HolidayClosure {
  date: string;    // "YYYY-MM-DD"
  label: string;
  closed: boolean;
}

export interface RestaurantSettings {
  name: string;
  shortName: string;
  tagline: string;
  whatsapp: string;
  phone: string;
  address: string;
  geo: {
    lat: number;
    lng: number;
  };
  bank_name: string;
  account_number: string;
  account_name: string;
  temporarily_closed: boolean;
  temporarily_closed_message?: string;
  hours: BusinessHours[];
  holidays: HolidayClosure[];
  updated_at: string;
}

export interface CartItem {
  dish: MenuItem;
  quantity: number;
}

export type OrderMode = 'dine_in' | 'pickup' | 'delivery';

export interface OrderPayload {
  id: string;
  idempotency_key: string;
  items: {
    id: string;
    name: string;
    price_ngn: number;
    quantity: number;
    line_total: number;
  }[];
  total_ngn: number;
  mode: OrderMode;
  table_no?: string;
  address?: string;
  customer_name: string;
  customer_phone?: string;
  payment_method: 'pay_at_table_or_delivery' | 'bank_transfer' | 'paystack';
  payment_status: 'unpaid' | 'pending' | 'paid';
  created_at: string;
}

export interface ReservationPayload {
  id: string;
  idempotency_key: string;
  name: string;
  phone: string;
  party_size: number;
  starts_at: string; // ISO date-time or formatted string
  notes?: string;
  status: 'new' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface SubscriberPayload {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export interface ImageMetadata {
  id: string;
  title: string;
  description: string;
  alt: string;
  blurhash: string;
  width: number;
  height: number;
  avif: {
    480: string;
    800: string;
    1200: string;
  };
  webp: {
    480: string;
    800: string;
    1200: string;
  };
  sourceUrl?: string;
  license?: string;
  isAiGenerated?: boolean;
}

