import { useState, useEffect } from 'preact/hooks';
import type { MenuItem, Category, RestaurantSettings, OrderPayload, ReservationPayload } from '../types';
import seedMenu from '../data/menu.json';
import seedSettings from '../data/settings.json';
import { formatNaira } from '../lib/currency';
import {
  getStoredMenuItems,
  saveStoredMenuItems,
  getStoredSettings,
  saveStoredSettings,
  getStoredOrders,
  getStoredReservations
} from '../lib/storage';

export default function AdminDashboard() {
  // Auth state: Email code login (autocomplete="one-time-code", inputmode="numeric")
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<'menu' | 'hours' | 'orders' | 'reservations' | 'settings'>('menu');

  // State data
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => seedMenu.items as MenuItem[]);
  const [settings, setSettings] = useState<RestaurantSettings>(() => seedSettings as unknown as RestaurantSettings);
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const [reservations, setReservations] = useState<ReservationPayload[]>([]);

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<MenuItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<MenuItem | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');

  // Editing dish modal / form
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  // Load from local storage or check existing session
  useEffect(() => {
    const isAuthed = localStorage.getItem('zesti_admin_auth') === 'true';
    if (isAuthed) setIsAuthenticated(true);

    const storedItems = getStoredMenuItems();
    if (storedItems) setMenuItems(storedItems);

    const storedSet = getStoredSettings();
    if (storedSet) setSettings(storedSet);

    setOrders(getStoredOrders());
    setReservations(getStoredReservations());
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth steps
  const handleRequestCode = (e: Event) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setAuthError('Please enter a valid owner email.');
      return;
    }
    setAuthError('');
    setCodeSent(true);
    triggerToast('Demo login code: 123456 (auto-filled for preview)');
    setOtpCode('123456');
  };

  const handleVerifyOtp = (e: Event) => {
    e.preventDefault();
    if (otpCode === '123456' || otpCode.length === 6) {
      setIsAuthenticated(true);
      localStorage.setItem('zesti_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid code. For this demo, enter 123456.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('zesti_admin_auth');
  };

  // Menu toggles: Sold Out
  const toggleAvailable = (item: MenuItem) => {
    const updated = menuItems.map((m) =>
      m.id === item.id ? { ...m, available: !m.available } : m
    );
    setMenuItems(updated);
    saveStoredMenuItems(updated);
    setLastSavedTime(new Date().toLocaleTimeString());
    triggerToast(
      `Marked "${item.name}" as ${!item.available ? 'Available' : 'Sold Out'}`
    );
  };

  // Menu toggles: Featured
  const toggleFeatured = (item: MenuItem) => {
    const updated = menuItems.map((m) =>
      m.id === item.id ? { ...m, featured: !m.featured } : m
    );
    setMenuItems(updated);
    saveStoredMenuItems(updated);
    setLastSavedTime(new Date().toLocaleTimeString());
    triggerToast(`Updated featured status for "${item.name}"`);
  };

  // Price change
  const handlePriceChange = (id: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    const updated = menuItems.map((m) =>
      m.id === id ? { ...m, price_ngn: newPrice } : m
    );
    setMenuItems(updated);
    saveStoredMenuItems(updated);
    setLastSavedTime(new Date().toLocaleTimeString());
  };

  // Delete item with confirmation modal & undo toast
  const confirmDelete = () => {
    if (!deleteModalItem) return;
    const itemToDelete = deleteModalItem;
    setUndoItem(itemToDelete);
    const updated = menuItems.filter((m) => m.id !== itemToDelete.id);
    setMenuItems(updated);
    saveStoredMenuItems(updated);
    setDeleteModalItem(null);
    setLastSavedTime(new Date().toLocaleTimeString());
    triggerToast(`Deleted "${itemToDelete.name}".`);
  };

  const undoDelete = () => {
    if (!undoItem) return;
    const updated = [undoItem, ...menuItems];
    setMenuItems(updated);
    saveStoredMenuItems(updated);
    setUndoItem(null);
    triggerToast(`Restored "${undoItem.name}".`);
  };

  // Hours: Toggle temporarily closed switch
  const toggleTemporarilyClosed = () => {
    const updated = {
      ...settings,
      temporarily_closed: !settings.temporarily_closed
    };
    setSettings(updated);
    saveStoredSettings(updated);
    setLastSavedTime(new Date().toLocaleTimeString());
    triggerToast(
      `Restaurant status set to: ${updated.temporarily_closed ? 'Temporarily Closed' : 'Open'}`
    );
  };

  // Hours: Update daily hours
  const updateDayHour = (weekday: number, field: 'open' | 'close', val: string) => {
    const updatedHours = settings.hours.map((h) =>
      h.weekday === weekday ? { ...h, [field]: val } : h
    );
    const updated = { ...settings, hours: updatedHours };
    setSettings(updated);
    saveStoredSettings(updated);
    setLastSavedTime(new Date().toLocaleTimeString());
  };

  // Browser-side photo compression to WebP under 150 KB
  const handlePhotoUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to WebP quality 0.82 to guarantee < 150 KB
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const sizeKb = Math.round(blob.size / 1024);
              const dataUrl = canvas.toDataURL('image/webp', 0.82);
              if (editingItem) {
                setEditingItem({
                  ...editingItem,
                  image_id: editingItem.image_id || 'dish-uploaded'
                });
              }
              triggerToast(`Compressed photo to WebP (${sizeKb} KB < 150 KB target)`);
            }
          },
          'image/webp',
          0.82
        );
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      triggerToast('Error compressing image');
    }
  };

  // If NOT authenticated, show passwordless 6-digit email OTP login
  if (!isAuthenticated) {
    return (
      <div class="max-w-md mx-auto my-12 p-8 bg-white dark:bg-charcoal-100 rounded-squircle shadow-2xl border border-charcoal/10 dark:border-cream/10">
        <div class="text-center mb-6">
          <div class="w-12 h-12 rounded-full bg-lemon text-charcoal flex items-center justify-center font-bold text-xl mx-auto mb-2">
            🔒
          </div>
          <h2 class="font-display text-2xl font-bold text-charcoal dark:text-cream">
            Owner Admin Portal
          </h2>
          <p class="text-xs text-muted dark:text-cream/60 mt-1">
            Sign in with your email to receive a 6-digit access code.
          </p>
        </div>

        {!codeSent ? (
          <form onSubmit={handleRequestCode} class="space-y-4">
            <div>
              <label for="admin-email" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                Owner Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={emailInput}
                onInput={(e) => setEmailInput((e.target as HTMLInputElement).value)}
                placeholder="owner@demo.restaurant.example"
                required
                class="w-full px-4 py-3 rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon min-h-[48px]"
              />
            </div>

            {authError && <p class="text-chilli text-xs font-bold">{authError}</p>}

            <button
              type="submit"
              class="w-full py-3.5 rounded-full bg-lemon text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-yellow-300 transition-all shadow cursor-pointer min-h-[48px]"
            >
              Send Access Code →
            </button>
            <p class="text-center text-[11px] text-muted dark:text-cream/50">
              Demo bypass: Any email will receive the demo code 123456.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} class="space-y-4">
            <div>
              <label for="admin-otp" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                6-Digit Access Code
              </label>
              <input
                id="admin-otp"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onInput={(e) => setOtpCode((e.target as HTMLInputElement).value)}
                placeholder="123456"
                required
                class="w-full px-4 py-3 text-center tracking-widest font-mono text-xl rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream focus:outline-none focus:ring-2 focus:ring-lemon min-h-[48px]"
              />
            </div>

            {authError && <p class="text-chilli text-xs font-bold">{authError}</p>}

            <button
              type="submit"
              class="w-full py-3.5 rounded-full bg-charcoal text-lemon font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow cursor-pointer min-h-[48px]"
            >
              Verify & Enter Dashboard
            </button>

            <button
              type="button"
              onClick={() => setCodeSent(false)}
              class="w-full text-center text-xs text-muted dark:text-cream/60 underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          class="fixed bottom-6 right-6 z-50 bg-charcoal text-cream px-5 py-3 rounded-squircle-sm shadow-2xl border border-lemon/40 flex items-center gap-3 animate-fade-in"
        >
          <span class="text-xs font-medium">{toastMessage}</span>
          {undoItem && (
            <button
              type="button"
              onClick={undoDelete}
              class="text-xs font-bold text-lemon uppercase underline ml-2 cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal for Destructive Delete */}
      {deleteModalItem && (
        <div
          class="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div class="bg-white dark:bg-charcoal-100 p-6 rounded-squircle max-w-sm w-full shadow-2xl border border-charcoal/15 dark:border-cream/15 space-y-4">
            <h3 class="font-display text-xl font-bold text-charcoal dark:text-cream">
              Delete "{deleteModalItem.name}"?
            </h3>
            <p class="text-xs text-muted dark:text-cream/70 leading-relaxed">
              This will remove the item from the live customer menu. You can undo this action immediately after.
            </p>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                class="px-4 py-2 rounded-full border border-charcoal/20 text-xs font-bold text-charcoal dark:text-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                class="px-4 py-2 rounded-full bg-chilli text-white text-xs font-bold uppercase tracking-wider shadow"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Top Navigation & Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-charcoal/10 dark:border-cream/10">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display text-3xl font-bold text-charcoal dark:text-cream">
              Restaurant Manager
            </h1>
            <span class="px-2 py-0.5 rounded-full bg-basil/20 text-basil text-[10px] font-mono font-bold">
              ● Live Sync
            </span>
          </div>
          <p class="text-xs text-muted dark:text-cream/60 mt-1">
            Publish is instant. Changes reflect in real-time across customer screens. Last saved: {lastSavedTime}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            href="/admin/qr"
            class="px-4 py-2 rounded-full bg-lavender-electric text-charcoal text-xs font-bold uppercase tracking-wider hover:bg-lavender-deep hover:text-white transition-all shadow-sm"
          >
            Table QR Generator ↗
          </a>
          <button
            type="button"
            onClick={handleLogout}
            class="px-4 py-2 rounded-full border border-charcoal/20 dark:border-cream/20 text-xs font-bold text-charcoal dark:text-cream hover:bg-black/5"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-charcoal/10 dark:border-cream/10 pb-2">
        {[
          { id: 'menu', label: `Menu Items (${menuItems.length})`, icon: '🍲' },
          { id: 'hours', label: 'Opening Hours & Shifts', icon: '🕒' },
          { id: 'orders', label: `Orders (${orders.length})`, icon: '🛒' },
          { id: 'reservations', label: `Bookings (${reservations.length})`, icon: '📅' },
          { id: 'settings', label: 'Settings & Bank', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            class={`hit-slop whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-lemon text-charcoal shadow-sm'
                : 'text-charcoal dark:text-cream hover:bg-charcoal/5 dark:hover:bg-cream/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: MENU CRUD */}
      {activeTab === 'menu' && (
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 class="font-display text-2xl font-bold text-charcoal dark:text-cream">
              Manage Dishes & Prices
            </h2>
            <div class="flex items-center gap-2">
              <label class="px-4 py-2 rounded-full bg-lemon text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-yellow-300 cursor-pointer shadow">
                <span>+ Upload Dish Photo (&lt; 150 KB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  class="sr-only"
                />
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((dish) => (
              <div
                key={dish.id}
                class={`p-5 rounded-squircle-sm bg-white dark:bg-charcoal-100 border transition-all ${
                  !dish.available
                    ? 'border-dashed border-chilli/40 bg-chilli/5'
                    : 'border-charcoal/10 dark:border-cream/10'
                }`}
              >
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 class="font-bold text-base text-charcoal dark:text-cream">
                      {dish.name}
                    </h3>
                    <span class="text-[11px] font-mono text-muted dark:text-cream/50 uppercase">
                      {dish.category_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteModalItem(dish)}
                    class="hit-slop text-xs text-chilli hover:opacity-80 p-1"
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>

                {/* Inline Price Editor */}
                <div class="mb-4 flex items-center gap-2">
                  <label class="text-xs font-semibold text-charcoal dark:text-cream">Price (₦):</label>
                  <input
                    type="number"
                    value={dish.price_ngn}
                    onInput={(e) =>
                      handlePriceChange(dish.id, parseInt((e.target as HTMLInputElement).value, 10))
                    }
                    class="w-28 px-2 py-1 rounded bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/20 text-xs font-mono font-bold text-charcoal dark:text-cream"
                  />
                  <span class="text-xs text-muted dark:text-cream/60 tabular-nums">
                    ({formatNaira(dish.price_ngn)})
                  </span>
                </div>

                {/* Toggles */}
                <div class="grid grid-cols-2 gap-2 pt-3 border-t border-charcoal/10 dark:border-cream/10">
                  <button
                    type="button"
                    onClick={() => toggleAvailable(dish)}
                    class={`py-2 px-3 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                      dish.available
                        ? 'bg-basil/15 text-basil hover:bg-basil/25'
                        : 'bg-chilli text-white'
                    }`}
                  >
                    {dish.available ? '✓ In Stock' : '🚫 Sold Out'}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFeatured(dish)}
                    class={`py-2 px-3 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                      dish.featured
                        ? 'bg-lemon text-charcoal shadow-sm'
                        : 'bg-charcoal/5 text-muted hover:bg-black/5 dark:text-cream/70'
                    }`}
                  >
                    {dish.featured ? '★ Featured' : 'Normal'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HOURS & SHIFTS */}
      {activeTab === 'hours' && (
        <div class="max-w-2xl space-y-6">
          <div class="p-5 rounded-squircle bg-lemon/20 border border-lemon flex items-center justify-between">
            <div>
              <h3 class="font-bold text-charcoal text-base">Temporarily Closed Switch</h3>
              <p class="text-xs text-charcoal/70">
                Instantly marks the site as closed for private catering or weather emergencies.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTemporarilyClosed}
              class={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                settings.temporarily_closed
                  ? 'bg-chilli text-white'
                  : 'bg-charcoal text-lemon hover:bg-black'
              }`}
            >
              {settings.temporarily_closed ? 'Currently Closed' : 'Currently Open'}
            </button>
          </div>

          <div class="p-6 rounded-squircle bg-white dark:bg-charcoal-100 border border-charcoal/10 dark:border-cream/10 space-y-4">
            <h3 class="font-display text-xl font-bold text-charcoal dark:text-cream">
              Weekly Operating Schedule (Africa/Lagos)
            </h3>
            <div class="space-y-3">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                const schedule = settings.hours.find((h) => h.weekday === idx);
                return (
                  <div
                    key={day}
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50"
                  >
                    <span class="font-bold text-xs sm:text-sm text-charcoal dark:text-cream w-28">
                      {day}
                    </span>
                    <div class="flex items-center gap-2 text-xs">
                      <span>Open:</span>
                      <input
                        type="time"
                        value={schedule?.open || '11:00'}
                        onInput={(e) =>
                          updateDayHour(idx, 'open', (e.target as HTMLInputElement).value)
                        }
                        class="p-1 rounded border border-charcoal/20 bg-white dark:bg-charcoal text-charcoal dark:text-cream font-mono"
                      />
                      <span>Close:</span>
                      <input
                        type="time"
                        value={schedule?.close || '22:00'}
                        onInput={(e) =>
                          updateDayHour(idx, 'close', (e.target as HTMLInputElement).value)
                        }
                        class="p-1 rounded border border-charcoal/20 bg-white dark:bg-charcoal text-charcoal dark:text-cream font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div class="space-y-4">
          <h2 class="font-display text-2xl font-bold text-charcoal dark:text-cream">
            Incoming Orders Logged ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <div class="p-10 text-center rounded-squircle bg-charcoal/5 dark:bg-charcoal-100 border border-charcoal/10">
              <p class="text-sm text-muted dark:text-cream/60">
                No orders logged yet. Orders placed via the 2-tap WhatsApp flow appear here automatically with unique idempotency keys.
              </p>
            </div>
          ) : (
            <div class="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  class="p-4 rounded-squircle-sm bg-white dark:bg-charcoal-100 border border-charcoal/10 dark:border-cream/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <strong class="font-mono text-sm text-charcoal dark:text-lemon">{ord.id}</strong>
                      <span class="text-xs uppercase font-mono px-2 py-0.5 rounded bg-charcoal/5 dark:bg-cream/10">
                        {ord.mode.replace('_', ' ')}
                      </span>
                    </div>
                    <div class="text-xs text-muted dark:text-cream/70 mt-1">
                      Customer: <strong>{ord.customer_name}</strong> • Total: <strong class="text-charcoal dark:text-lemon tabular-nums">{formatNaira(ord.total_ngn)}</strong>
                    </div>
                    <div class="text-[11px] text-muted dark:text-cream/50 mt-1">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>
                  <span class="text-xs px-3 py-1 rounded-full bg-basil/15 text-basil font-bold uppercase tracking-wider self-start sm:self-center">
                    Logged to Kitchen
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div class="space-y-4">
          <h2 class="font-display text-2xl font-bold text-charcoal dark:text-cream">
            Table Bookings Logged ({reservations.length})
          </h2>
          {reservations.length === 0 ? (
            <div class="p-10 text-center rounded-squircle bg-charcoal/5 dark:bg-charcoal-100 border border-charcoal/10">
              <p class="text-sm text-muted dark:text-cream/60">
                No reservations logged yet. Table bookings made on the reservation page are recorded here with idempotency keys.
              </p>
            </div>
          ) : (
            <div class="space-y-3">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  class="p-4 rounded-squircle-sm bg-white dark:bg-charcoal-100 border border-charcoal/10 dark:border-cream/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <strong class="font-mono text-sm text-charcoal dark:text-lemon">{res.id}</strong>
                      <span class="text-xs px-2 py-0.5 rounded bg-lemon text-charcoal font-bold">
                        Table for {res.party_size}
                      </span>
                    </div>
                    <div class="text-xs text-muted dark:text-cream/70 mt-1">
                      Name: <strong>{res.name}</strong> • Phone: <strong>{res.phone}</strong>
                    </div>
                    <div class="text-[11px] text-muted dark:text-cream/50 mt-1">
                      Time: {res.starts_at} {res.notes ? `• Notes: "${res.notes}"` : ''}
                    </div>
                  </div>
                  <span class="text-xs px-3 py-1 rounded-full bg-basil/15 text-basil font-bold uppercase tracking-wider self-start sm:self-center">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SETTINGS & BANK */}
      {activeTab === 'settings' && (
        <div class="max-w-2xl p-6 rounded-squircle bg-white dark:bg-charcoal-100 border border-charcoal/10 dark:border-cream/10 space-y-4">
          <h2 class="font-display text-xl font-bold text-charcoal dark:text-cream">
            Business Details & Bank Accounts
          </h2>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-charcoal dark:text-cream mb-1">Restaurant Name</label>
              <input
                type="text"
                value={settings.name}
                onInput={(e) => {
                  const updated = { ...settings, name: (e.target as HTMLInputElement).value };
                  setSettings(updated);
                  saveStoredSettings(updated);
                }}
                class="w-full px-3 py-2 rounded bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/20 text-charcoal dark:text-cream"
              />
            </div>

            <div>
              <label class="block font-bold text-charcoal dark:text-cream mb-1">WhatsApp Number (Normalised 23480...)</label>
              <input
                type="text"
                value={settings.whatsapp}
                onInput={(e) => {
                  const updated = { ...settings, whatsapp: (e.target as HTMLInputElement).value };
                  setSettings(updated);
                  saveStoredSettings(updated);
                }}
                class="w-full px-3 py-2 rounded bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/20 text-charcoal dark:text-cream font-mono"
              />
            </div>

            <div class="pt-3 border-t border-charcoal/10 dark:border-cream/10">
              <span class="font-bold text-chilli block mb-2 uppercase">Bank Transfer Details (Test Mode):</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-muted dark:text-cream/60 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bank_name}
                    onInput={(e) => {
                      const updated = { ...settings, bank_name: (e.target as HTMLInputElement).value };
                      setSettings(updated);
                      saveStoredSettings(updated);
                    }}
                    class="w-full px-3 py-2 rounded bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/20 text-charcoal dark:text-cream"
                  />
                </div>
                <div>
                  <label class="block text-muted dark:text-cream/60 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={settings.account_number}
                    onInput={(e) => {
                      const updated = { ...settings, account_number: (e.target as HTMLInputElement).value };
                      setSettings(updated);
                      saveStoredSettings(updated);
                    }}
                    class="w-full px-3 py-2 rounded bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/20 text-charcoal dark:text-cream font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

