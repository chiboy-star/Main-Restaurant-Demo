import type { MenuItem, Category, RestaurantSettings, OrderPayload, ReservationPayload } from '../types';
import seedMenu from '../data/menu.json';
import seedSettings from '../data/settings.json';

const STORAGE_KEYS = {
  MENU_ITEMS: 'zesti_menu_items_v1',
  CATEGORIES: 'zesti_categories_v1',
  SETTINGS: 'zesti_settings_v1',
  CART: 'zesti_cart_v1',
  ORDERS: 'zesti_orders_v1',
  RESERVATIONS: 'zesti_reservations_v1',
  UTM: 'zesti_utm_v1',
  COOKIE_CONSENT: 'zesti_cookie_consent_v1',
  LAST_DELETED_ITEM: 'zesti_undo_deleted_item_v1'
};

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

export function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return seedMenu.categories;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(seedMenu.categories));
      return seedMenu.categories;
    }
    return JSON.parse(raw);
  } catch (e) {
    return seedMenu.categories;
  }
}

export function getStoredMenuItems(): MenuItem[] {
  if (typeof window === 'undefined') return seedMenu.items as MenuItem[];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(seedMenu.items));
      return seedMenu.items as MenuItem[];
    }
    return JSON.parse(raw);
  } catch (e) {
    return seedMenu.items as MenuItem[];
  }
}

export function saveStoredMenuItems(items: MenuItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
}

export function getStoredSettings(): RestaurantSettings {
  if (typeof window === 'undefined') return seedSettings as unknown as RestaurantSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(seedSettings));
      return seedSettings as unknown as RestaurantSettings;
    }
    return JSON.parse(raw);
  } catch (e) {
    return seedSettings as unknown as RestaurantSettings;
  }
}

export function saveStoredSettings(settings: RestaurantSettings): void {
  if (typeof window === 'undefined') return;
  settings.updated_at = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredOrders(): OrderPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: OrderPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const orders = getStoredOrders();
    // Idempotency check
    const existingIndex = orders.findIndex(o => o.idempotency_key === order.idempotency_key || o.id === order.id);
    if (existingIndex >= 0) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save order locally', e);
  }
}

export function getStoredReservations(): ReservationPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReservation(reservation: ReservationPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredReservations();
    const existingIndex = list.findIndex(r => r.idempotency_key === reservation.idempotency_key || r.id === reservation.id);
    if (existingIndex >= 0) {
      list[existingIndex] = reservation;
    } else {
      list.unshift(reservation);
    }
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save reservation locally', e);
  }
}

export function captureUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const [key, val] of params.entries()) {
      if (key.startsWith('utm_') || key === 't' || key === 'ref') {
        utm[key] = val;
      }
    }
    if (Object.keys(utm).length > 0) {
      localStorage.setItem(STORAGE_KEYS.UTM, JSON.stringify(utm));
    } else {
      const stored = localStorage.getItem(STORAGE_KEYS.UTM);
      if (stored) return JSON.parse(stored);
    }
    return utm;
  } catch {
    return {};
  }
}

export function getCookieConsent(): boolean | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT);
  if (val === 'accepted') return true;
  if (val === 'declined') return false;
  return null;
}

export function setCookieConsent(accepted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, accepted ? 'accepted' : 'declined');
}
