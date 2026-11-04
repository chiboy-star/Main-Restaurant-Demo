import { useState, useEffect } from 'preact/hooks';
import seedMenu from '../data/menu.json';
import { formatNaira } from '../lib/currency';
import type { MenuItem } from '../types';

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Handle Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('zesti:open-command-menu', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('zesti:open-command-menu', handleCustomOpen);
    };
  }, [isOpen]);

  const navActions = [
    { label: 'Explore Full Menu & Order', path: '/menu', category: 'Navigation', icon: '🍲' },
    { label: 'Reserve a Table (2-Tap)', path: '/reserve', category: 'Navigation', icon: '📅' },
    { label: 'Our Story & Heritage', path: '/about', category: 'Navigation', icon: '📖' },
    { label: 'Photo Gallery & Ambiance', path: '/gallery', category: 'Navigation', icon: '📸' },
    { label: 'Frequently Asked Questions', path: '/faq', category: 'Navigation', icon: '❓' },
    { label: 'Directions & Click-to-Call', path: '/contact', category: 'Navigation', icon: '📍' },
    { label: 'Pitch Deck & Checklist For Owners', path: '/for-owners', category: 'Owners', icon: '💼' },
    { label: 'Owner Admin Dashboard', path: '/admin', category: 'Admin', icon: '🔒' },
    { label: 'Generate Table QR Menus', path: '/admin/qr', category: 'Admin', icon: '📱' }
  ];

  const filteredDishes = query.trim()
    ? (seedMenu.items as MenuItem[]).filter(
        (dish) =>
          dish.name.toLowerCase().includes(query.toLowerCase()) ||
          dish.description.toLowerCase().includes(query.toLowerCase()) ||
          (dish.tags && dish.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())))
      ).slice(0, 5)
    : [];

  const filteredNav = navActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())
  );

  const selectDish = (dish: MenuItem) => {
    setIsOpen(false);
    if (!window.location.pathname.includes('/menu')) {
      window.location.href = `/menu?search=${encodeURIComponent(dish.name)}`;
    } else {
      window.dispatchEvent(new CustomEvent('zesti:select-dish', { detail: { dishId: dish.id } }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-[100] bg-charcoal/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 transition-opacity"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Menu Search"
    >
      <div
        class="w-full max-w-xl bg-white dark:bg-charcoal-100 rounded-squircle-sm shadow-2xl border border-charcoal/20 dark:border-cream/20 overflow-hidden flex flex-col max-h-[80vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div class="p-4 border-b border-charcoal/10 dark:border-cream/10 flex items-center gap-3">
          <svg class="w-5 h-5 text-charcoal/50 dark:text-cream/50 fill-none stroke-current stroke-2 shrink-0" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            autoFocus
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Type a command, dish, suya, or jump to page..."
            class="flex-1 bg-transparent text-charcoal dark:text-cream placeholder-charcoal/40 dark:placeholder-cream/40 text-base focus:outline-none"
          />
          <kbd class="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-charcoal/5 dark:bg-cream/10 text-muted dark:text-cream/70 border border-charcoal/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div class="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Dish Results */}
          {filteredDishes.length > 0 && (
            <div>
              <div class="text-[10px] uppercase font-mono tracking-widest font-bold text-muted dark:text-cream/50 px-3 py-1">
                Dishes & Items
              </div>
              <div class="space-y-1">
                {filteredDishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => selectDish(dish)}
                    class="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-lemon/20 dark:hover:bg-cream/10 transition-colors text-left group cursor-pointer"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-lg">🍲</span>
                      <div>
                        <div class="font-bold text-sm text-charcoal dark:text-cream group-hover:text-charcoal dark:group-hover:text-lemon">
                          {dish.name}
                        </div>
                        <div class="text-xs text-muted dark:text-cream/60 line-clamp-1">
                          {dish.description}
                        </div>
                      </div>
                    </div>
                    <div class="font-display font-bold text-sm text-charcoal dark:text-lemon tabular-nums shrink-0">
                      {formatNaira(dish.price_ngn)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div>
            <div class="text-[10px] uppercase font-mono tracking-widest font-bold text-muted dark:text-cream/50 px-3 py-1">
              Quick Actions & Navigation
            </div>
            <div class="space-y-1">
              {filteredNav.map((action) => (
                <a
                  key={action.path}
                  href={action.path}
                  onClick={() => setIsOpen(false)}
                  class="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-lemon/20 dark:hover:bg-cream/10 transition-colors text-charcoal dark:text-cream"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-lg">{action.icon}</span>
                    <span class="font-semibold text-sm">{action.label}</span>
                  </div>
                  <span class="text-xs font-mono text-muted dark:text-cream/40">
                    {action.category}
                  </span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer shortcuts helper */}
        <div class="p-3 bg-charcoal/5 dark:bg-charcoal-200 border-t border-charcoal/10 dark:border-cream/10 text-[11px] text-muted dark:text-cream/60 flex items-center justify-between">
          <span>Tip: Press <strong>Ctrl+K</strong> or <strong>⌘K</strong> anywhere to search</span>
          <span>Zesti Kitchen (Demo)</span>
        </div>
      </div>
    </div>
  );
}
