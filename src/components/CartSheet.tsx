import { useState, useEffect, useRef } from 'preact/hooks';
import type { MenuItem, CartItem, OrderMode, OrderPayload } from '../types';
import { formatNaira } from '../lib/currency';
import { buildWhatsAppOrderUrl } from '../lib/whatsapp';
import { generateIdempotencyKey, saveOrder, captureUtmParams } from '../lib/storage';
import defaultSettings from '../data/settings.json';

export default function CartSheet() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<OrderMode>('dine_in');
  const [tableNo, setTableNo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('Guest Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentOption, setPaymentOption] = useState<'pay_later' | 'bank_transfer' | 'paystack'>('pay_later');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [undoItem, setUndoItem] = useState<{ item: CartItem; index: number } | null>(null);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  // Touch handling for swipe-to-dismiss bottom sheet
  const touchStartY = useRef<number | null>(null);
  const sheetContentRef = useRef<HTMLDivElement | null>(null);

  // Initialize and listen to add-to-cart events
  useEffect(() => {
    // Read ?t= from URL
    const params = new URLSearchParams(window.location.search);
    const table = params.get('t') || params.get('table');
    if (table) {
      setTableNo(table);
      setMode('dine_in');
    }

    // Load persisted cart if any
    try {
      const stored = localStorage.getItem('zesti_cart_v1');
      if (stored) setItems(JSON.parse(stored));
    } catch {}

    const handleAddToCart = (e: CustomEvent<{ dish: MenuItem; quantity: number; tableNo?: string }>) => {
      const { dish, quantity, tableNo: table } = e.detail;
      if (table) {
        setTableNo(table);
        setMode('dine_in');
      }

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.dish.id === dish.id);
        let updated: CartItem[];
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex].quantity += quantity;
        } else {
          updated = [...prev, { dish, quantity }];
        }
        localStorage.setItem('zesti_cart_v1', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('zesti:add-to-cart' as any, handleAddToCart);
    return () => window.removeEventListener('zesti:add-to-cart' as any, handleAddToCart);
  }, []);

  // Predictive back button closes sheet first
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ cartSheet: true }, '');
      const handlePopState = () => setIsOpen(false);
      window.addEventListener('popstate', handlePopState, { once: true });
    }
  }, [isOpen]);

  const updateQuantity = (dishId: string, delta: number) => {
    setItems((prev) => {
      const targetIndex = prev.findIndex((i) => i.dish.id === dishId);
      if (targetIndex === -1) return prev;

      const current = prev[targetIndex];
      const newQty = current.quantity + delta;

      let updated: CartItem[];
      if (newQty <= 0) {
        // Trigger undo toast
        setUndoItem({ item: current, index: targetIndex });
        updated = prev.filter((i) => i.dish.id !== dishId);
      } else {
        updated = [...prev];
        updated[targetIndex].quantity = newQty;
      }
      localStorage.setItem('zesti_cart_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreUndoItem = () => {
    if (!undoItem) return;
    setItems((prev) => {
      const updated = [...prev];
      updated.splice(undoItem.index, 0, undoItem.item);
      localStorage.setItem('zesti_cart_v1', JSON.stringify(updated));
      return updated;
    });
    setUndoItem(null);
  };

  const totalNgn = items.reduce((acc, curr) => acc + curr.dish.price_ngn * curr.quantity, 0);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Send Order on WhatsApp (Tap 2 of 2-Tap Order Flow)
  const handleSendOrder = () => {
    if (items.length === 0) return;

    const idempotencyKey = generateIdempotencyKey();
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    setLastOrderId(orderId);

    const utm = captureUtmParams();

    const orderPayload: OrderPayload = {
      id: orderId,
      idempotency_key: idempotencyKey,
      items: items.map((i) => ({
        id: i.dish.id,
        name: i.dish.name,
        price_ngn: i.dish.price_ngn,
        quantity: i.quantity,
        line_total: i.dish.price_ngn * i.quantity
      })),
      total_ngn: totalNgn,
      mode,
      table_no: mode === 'dine_in' ? tableNo : undefined,
      address: mode === 'delivery' ? deliveryAddress : undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      payment_method: paymentOption === 'bank_transfer' ? 'bank_transfer' : paymentOption === 'paystack' ? 'paystack' : 'pay_at_table_or_delivery',
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };

    // Save order with idempotency key
    saveOrder(orderPayload);

    // Build URL-encoded WhatsApp Link
    const waUrl = buildWhatsAppOrderUrl({
      businessPhone: defaultSettings.whatsapp,
      restaurantName: defaultSettings.name,
      items: items.map((i) => ({
        name: i.dish.name,
        quantity: i.quantity,
        price_ngn: i.dish.price_ngn
      })),
      totalNgn,
      mode,
      tableNo: mode === 'dine_in' ? tableNo : undefined,
      deliveryAddress: mode === 'delivery' ? deliveryAddress : undefined,
      customerName,
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign
    });

    setOrderSentSuccess(true);

    // Open WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const copyBankDetails = () => {
    const text = `Bank: ${defaultSettings.bank_name}\nAccount: ${defaultSettings.account_number}\nName: ${defaultSettings.account_name}\nAmount: ${formatNaira(totalNgn)}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 3000);
  };

  const sendBankTransferWhatsApp = () => {
    const ref = lastOrderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const text = `Hi Zesti Kitchen (Demo), I have paid ${formatNaira(totalNgn)} via Bank Transfer for Order ${ref}. Customer: ${customerName}.`;
    window.open(`https://wa.me/${defaultSettings.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Swipe down to dismiss
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 80) {
      setIsOpen(false);
      touchStartY.current = null;
    }
  };

  if (items.length === 0 && !undoItem) return null;

  return (
    <>
      {/* Undo Toast Notification (UX Checklist #5) */}
      {undoItem && (
        <aside
          role="status"
          aria-live="polite"
          class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-cream px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-lemon/40 animate-fade-in"
        >
          <span class="text-xs">Removed <strong>{undoItem.item.dish.name}</strong></span>
          <button
            type="button"
            onClick={restoreUndoItem}
            class="text-xs font-bold text-lemon uppercase tracking-wider underline hover:opacity-90 cursor-pointer"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setUndoItem(null)}
            class="text-xs text-cream/50 hover:text-cream ml-1"
            aria-label="Dismiss undo notification"
          >
            ✕
          </button>
        </aside>
      )}

      {/* Sticky Bottom Cart Bar (Safe Area Padding & Tap 2 of 2-Tap Order) */}
      {!isOpen && items.length > 0 && (
        <aside
          id="cart-sticky-bar"
          aria-label="Current order sticky summary"
          class="fixed bottom-0 inset-x-0 z-[60] bg-charcoal text-cream border-t border-lemon/30 shadow-[0_-8px_30px_rgba(0,0,0,0.3)] safe-pb animate-slide-up"
        >
          <div class="max-w-4xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
            
            {/* Left: View Details button & Cart Total */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              class="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-lemon rounded-lg p-1 cursor-pointer"
              aria-label={`View order: ${itemCount} items, total ${formatNaira(totalNgn)}`}
            >
              <div class="relative w-10 h-10 rounded-full bg-lemon text-charcoal flex items-center justify-center font-bold text-sm shadow">
                🛒
                <span class="absolute -top-1 -right-1 bg-chilli text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-charcoal">
                  {itemCount}
                </span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wider text-cream/70 font-mono">
                  {mode === 'dine_in' && tableNo ? `Table #${tableNo}` : mode.replace('_', ' ')}
                </span>
                <span class="font-display font-extrabold text-xl text-lemon tabular-nums">
                  {formatNaira(totalNgn)}
                </span>
              </div>
            </button>

            {/* Right: Direct 2nd Tap "Send on WhatsApp" */}
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                class="hidden sm:inline-flex px-3.5 py-2.5 rounded-full border border-cream/20 text-xs font-semibold hover:bg-white/10"
              >
                Review Items
              </button>

              <button
                type="button"
                onClick={handleSendOrder}
                class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-whatsapp text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white min-h-[44px] cursor-pointer"
                aria-label="Send order directly on WhatsApp (Tap 2)"
              >
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
                </svg>
                <span>Send on WhatsApp</span>
                <span class="hidden md:inline text-[10px] opacity-80">(Tap 2)</span>
              </button>
            </div>

          </div>
        </aside>
      )}

      {/* Swipe-to-Dismiss Bottom Sheet Drawer */}
      {isOpen && (
        <div
          class="fixed inset-0 z-50 bg-charcoal/80 backdrop-blur-sm flex justify-center items-end transition-opacity"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
        >
          <div
            ref={sheetContentRef}
            class="w-full max-w-xl bg-cream dark:bg-charcoal-100 rounded-t-[32px] max-h-[90vh] flex flex-col shadow-2xl safe-pb overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/* Sheet Swipe Handle */}
            <div class="pt-3 pb-2 flex justify-center cursor-grab">
              <div class="w-12 h-1.5 bg-charcoal/20 dark:bg-cream/20 rounded-full" />
            </div>

            {/* Header */}
            <div class="px-6 py-3 flex items-center justify-between border-b border-charcoal/10 dark:border-cream/10">
              <div>
                <h2 id="cart-title" class="font-display font-bold text-2xl text-charcoal dark:text-cream">
                  Your Order
                </h2>
                <p class="text-xs text-muted dark:text-cream/60">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                class="hit-slop p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-charcoal dark:text-cream cursor-pointer"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              
              {/* Order Mode Segmented Selector */}
              <div>
                <label class="block text-xs font-mono uppercase tracking-wider font-bold text-muted dark:text-cream/70 mb-2">
                  Dining Option
                </label>
                <div class="grid grid-cols-3 gap-2 p-1 bg-charcoal/5 dark:bg-charcoal/30 rounded-squircle-sm border border-charcoal/10 dark:border-cream/10">
                  {(['dine_in', 'pickup', 'delivery'] as OrderMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      class={`py-2 px-3 rounded-squircle-sm text-xs font-bold capitalize transition-all cursor-pointer ${
                        mode === m
                          ? 'bg-lemon text-charcoal shadow-sm'
                          : 'text-charcoal dark:text-cream hover:bg-white/40'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode-specific Fields */}
              {mode === 'dine_in' && (
                <div>
                  <label for="table-no-input" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                    Table Number
                  </label>
                  <input
                    id="table-no-input"
                    type="text"
                    value={tableNo}
                    onInput={(e) => setTableNo((e.target as HTMLInputElement).value)}
                    placeholder="e.g. 12"
                    class="w-full px-4 py-2.5 rounded-squircle-sm bg-white dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon"
                  />
                  <p class="text-[11px] text-muted dark:text-cream/50 mt-1">
                    If seated, enter the number on your table card.
                  </p>
                </div>
              )}

              {mode === 'delivery' && (
                <div>
                  <label for="delivery-addr-input" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                    Delivery Address in Lekki / Victoria Island
                  </label>
                  <input
                    id="delivery-addr-input"
                    type="text"
                    value={deliveryAddress}
                    onInput={(e) => setDeliveryAddress((e.target as HTMLInputElement).value)}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                    class="w-full px-4 py-2.5 rounded-squircle-sm bg-white dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon"
                  />
                </div>
              )}

              <div>
                <label for="customer-name-input" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                  Your Name (for order ticket)
                </label>
                <input
                  id="customer-name-input"
                  type="text"
                  value={customerName}
                  onInput={(e) => setCustomerName((e.target as HTMLInputElement).value)}
                  placeholder="e.g. Funke A."
                  class="w-full px-4 py-2.5 rounded-squircle-sm bg-white dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon"
                />
              </div>

              {/* Items List */}
              <div class="border-t border-charcoal/10 dark:border-cream/10 pt-4">
                <h3 class="text-xs font-mono uppercase tracking-wider font-bold text-muted dark:text-cream/70 mb-3">
                  Selected Dishes
                </h3>
                <div class="space-y-3">
                  {items.map(({ dish, quantity }) => (
                    <div
                      key={dish.id}
                      class="flex items-center justify-between gap-3 p-3 rounded-squircle-sm bg-white dark:bg-charcoal-50 border border-charcoal/10 dark:border-cream/10 shadow-sm"
                    >
                      <div class="flex-1">
                        <div class="font-bold text-sm text-charcoal dark:text-cream leading-tight">
                          {dish.name}
                        </div>
                        <div class="text-xs text-muted dark:text-cream/60 tabular-nums">
                          {formatNaira(dish.price_ngn)} each
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish.id, -1)}
                          class="hit-slop w-8 h-8 rounded-full border border-charcoal/20 dark:border-cream/20 flex items-center justify-center font-bold text-sm text-charcoal dark:text-cream hover:bg-black/5 cursor-pointer"
                          aria-label={`Decrease quantity of ${dish.name}`}
                        >
                          -
                        </button>
                        <span class="font-bold text-sm w-5 text-center tabular-nums text-charcoal dark:text-cream">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish.id, 1)}
                          class="hit-slop w-8 h-8 rounded-full border border-charcoal/20 dark:border-cream/20 flex items-center justify-center font-bold text-sm text-charcoal dark:text-cream hover:bg-black/5 cursor-pointer"
                          aria-label={`Increase quantity of ${dish.name}`}
                        >
                          +
                        </button>
                      </div>

                      <div class="font-display font-bold text-sm text-charcoal dark:text-lemon tabular-nums w-20 text-right">
                        {formatNaira(dish.price_ngn * quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods (Hard Rule 5: Test Mode Labelled) */}
              <div class="border-t border-charcoal/10 dark:border-cream/10 pt-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-mono uppercase tracking-wider font-bold text-muted dark:text-cream/70">
                    Payment Method
                  </span>
                  <span class="text-[10px] uppercase font-bold text-chilli bg-chilli/10 px-2 py-0.5 rounded-full font-mono">
                    Test Mode Only
                  </span>
                </div>

                <div class="space-y-2 text-xs">
                  <label class="flex items-center gap-2 p-3 rounded-squircle-sm border border-charcoal/10 dark:border-cream/10 bg-white dark:bg-charcoal-50 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentOption === 'pay_later'}
                      onChange={() => { setPaymentOption('pay_later'); setShowBankDetails(false); }}
                    />
                    <span class="font-bold text-charcoal dark:text-cream">
                      Pay at table or on delivery (Default: 2-Tap flow)
                    </span>
                  </label>

                  <label class="flex items-center gap-2 p-3 rounded-squircle-sm border border-charcoal/10 dark:border-cream/10 bg-white dark:bg-charcoal-50 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_option"
                      checked={paymentOption === 'bank_transfer'}
                      onChange={() => { setPaymentOption('bank_transfer'); setShowBankDetails(true); }}
                    />
                    <span class="font-bold text-charcoal dark:text-cream">
                      Bank Transfer (Instant copy + "I Have Paid")
                    </span>
                  </label>
                </div>

                {showBankDetails && (
                  <div class="mt-3 p-4 rounded-squircle-sm bg-lemon/20 border border-lemon text-charcoal text-xs space-y-2">
                    <div class="font-bold flex items-center justify-between">
                      <span>Simulated Bank Account (Test Mode):</span>
                      <button
                        type="button"
                        onClick={copyBankDetails}
                        class="px-2.5 py-1 rounded bg-charcoal text-lemon font-bold text-[10px] uppercase cursor-pointer"
                      >
                        {copiedBank ? '✓ Copied' : 'Copy Account'}
                      </button>
                    </div>
                    <div>Bank: <strong>{defaultSettings.bank_name}</strong></div>
                    <div>Account Number: <strong class="font-mono text-sm">{defaultSettings.account_number}</strong></div>
                    <div>Account Name: <strong>{defaultSettings.account_name}</strong></div>
                    <button
                      type="button"
                      onClick={sendBankTransferWhatsApp}
                      class="w-full mt-2 py-2 rounded-full bg-charcoal text-lemon font-bold text-xs uppercase cursor-pointer"
                    >
                      Notify Kitchen: "I Have Paid" on WhatsApp
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Actions */}
            <div class="px-6 py-4 bg-charcoal text-cream border-t border-white/10 flex flex-col gap-3">
              <div class="flex items-center justify-between font-display text-xl font-bold">
                <span>Total Amount:</span>
                <span class="text-lemon tabular-nums text-2xl">{formatNaira(totalNgn)}</span>
              </div>

              <button
                type="button"
                onClick={handleSendOrder}
                class="w-full py-4 rounded-squircle bg-whatsapp text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all shadow-xl min-h-[48px] cursor-pointer"
              >
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
                </svg>
                <span>Send Order on WhatsApp (Tap 2)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  localStorage.removeItem('zesti_cart_v1');
                  setIsOpen(false);
                }}
                class="text-center text-xs text-cream/50 hover:text-cream underline py-1"
              >
                Clear Cart
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

