import { useState, useEffect, useMemo } from 'preact/hooks';
import type { MenuItem, Category } from '../types';
import seedMenu from '../data/menu.json';
import { formatNaira } from '../lib/currency';
import { getStoredMenuItems, getStoredCategories } from '../lib/storage';

interface Props {
  initialTable?: string;
}

export default function MenuCatalog({ initialTable }: Props) {
  const [categories, setCategories] = useState<Category[]>(() => seedMenu.categories);
  const [items, setItems] = useState<MenuItem[]>(() => seedMenu.items as MenuItem[]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>(initialTable || '');
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null);

  // Stale-while-revalidate for menu & categories
  useEffect(() => {
    const localCategories = getStoredCategories();
    const localItems = getStoredMenuItems();
    if (localCategories && localCategories.length > 0) setCategories(localCategories);
    if (localItems && localItems.length > 0) setItems(localItems);

    // Read ?t= from URL if not passed
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('t') || params.get('table');
    if (tableParam) setTableNumber(tableParam);

    // Listen to command menu search dish events
    const handleSearchSelect = (e: CustomEvent<{ dishId: string }>) => {
      const dish = localItems.find((d) => d.id === e.detail.dishId);
      if (dish) {
        setSelectedCategory('all');
        setSearchQuery(dish.name);
        const el = document.getElementById(`dish-${dish.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('zesti:select-dish' as any, handleSearchSelect);
    return () => window.removeEventListener('zesti:select-dish' as any, handleSearchSelect);
  }, []);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    let result = items;
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category_id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [items, selectedCategory, searchQuery]);

  // Optimistic Add to Cart (Flow: Tap 1 of 2-Tap Order)
  const handleAddToCart = (dish: MenuItem) => {
    if (!dish.available) return;
    window.dispatchEvent(
      new CustomEvent('zesti:add-to-cart', {
        detail: { dish, quantity: 1, tableNo: tableNumber }
      })
    );
  };

  const toggleDetails = (id: string) => {
    setExpandedDishId((prev) => (prev === id ? null : id));
  };

  return (
    <div class="w-full">
      {/* Table Detection Notification Banner if ?t= is present */}
      {tableNumber && (
        <div class="bg-lemon/30 border border-lemon rounded-squircle-sm p-3 mb-6 flex items-center justify-between text-xs font-bold text-charcoal">
          <div class="flex items-center gap-2">
            <span class="text-base">🪑</span>
            <span>Ordering for <strong>Table #{tableNumber}</strong> (detected from QR code)</span>
          </div>
          <button
            type="button"
            onClick={() => setTableNumber('')}
            class="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Change
          </button>
        </div>
      )}

      {/* Sticky Category Chips & Live Search Bar */}
      <div class="sticky top-[68px] z-30 bg-cream/95 dark:bg-charcoal/95 backdrop-blur-md pt-3 pb-3 border-b border-charcoal/10 dark:border-cream/10 -mx-4 px-4 sm:mx-0 sm:px-0">
        
        {/* Search Input with no layout shift */}
        <div class="relative mb-3">
          <label for="menu-search-input" class="sr-only">Search dishes, suya, jollof, or drinks</label>
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal/50 dark:text-cream/50">
            <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            id="menu-search-input"
            type="search"
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder="Search dishes, suya, swallow, or drinks..."
            class="w-full pl-10 pr-10 py-2.5 rounded-full bg-white dark:bg-charcoal-100 text-charcoal dark:text-cream placeholder-charcoal/40 dark:placeholder-cream/40 border border-charcoal/15 dark:border-cream/15 focus:outline-none focus:ring-2 focus:ring-lemon text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-charcoal/60 dark:text-cream/60 hover:text-charcoal cursor-pointer"
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Horizontal Scrolling Chips */}
        <div
          class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
          role="tablist"
          aria-label="Menu categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            class={`hit-slop whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
              selectedCategory === 'all'
                ? 'bg-charcoal text-lemon dark:bg-cream dark:text-charcoal shadow-sm'
                : 'bg-white/80 dark:bg-charcoal-50 text-charcoal dark:text-cream border border-charcoal/10 dark:border-cream/10 hover:bg-black/5'
            }`}
          >
            All Items ({items.length})
          </button>

          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.id)}
                class={`hit-slop whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                  isSelected
                    ? 'bg-charcoal text-lemon dark:bg-cream dark:text-charcoal shadow-sm'
                    : 'bg-white/80 dark:bg-charcoal-50 text-charcoal dark:text-cream border border-charcoal/10 dark:border-cream/10 hover:bg-black/5'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div class="pt-6 pb-28">
        {filteredDishes.length === 0 ? (
          <div class="py-16 text-center">
            <div class="text-4xl mb-2">🍽️</div>
            <h3 class="font-display text-xl text-charcoal dark:text-cream font-bold">No dishes found</h3>
            <p class="text-muted dark:text-cream/60 text-sm mt-1">Try another search term or select another category.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              class="mt-4 px-4 py-2 rounded-full bg-lemon text-charcoal font-bold text-xs uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => {
              const isExpanded = expandedDishId === dish.id;
              const isSoldOut = !dish.available;

              return (
                <article
                  key={dish.id}
                  id={`dish-${dish.id}`}
                  class={`squircle bg-white dark:bg-charcoal-100 border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isSoldOut
                      ? 'opacity-65 border-dashed border-charcoal/20 dark:border-cream/20 bg-charcoal/5 dark:bg-charcoal-300'
                      : 'border-charcoal/10 dark:border-cream/10 hover:border-lemon'
                  }`}
                >
                  <div>
                    {/* Dish Photo with fallback and aspect ratio */}
                    <div class="relative w-full aspect-[16/10] bg-charcoal/5 dark:bg-charcoal/30 overflow-hidden group">
                      <img
                        src={`/images/${dish.image_id}.webp`}
                        alt={dish.name}
                        width="480"
                        height="300"
                        loading="lazy"
                        class={`w-full h-full object-cover transition-transform duration-500 ${
                          isSoldOut ? 'grayscale contrast-75' : 'group-hover:scale-105'
                        }`}
                        onerror="this.onerror=null; this.src='/images/placeholder-dish.svg';"
                      />

                      {/* Sold Out Overlay Badge */}
                      {isSoldOut && (
                        <div class="absolute inset-0 bg-charcoal/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span class="px-3.5 py-1.5 rounded-full bg-chilli text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                            <span>🚫</span> Sold Out Today
                          </span>
                        </div>
                      )}

                      {/* Featured / Chef's Pick Badge (Von Restorff) */}
                      {dish.featured && !isSoldOut && (
                        <div class="absolute top-3 left-3 bg-lemon text-charcoal px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                          ★ Chef's Pick
                        </div>
                      )}

                      {/* Category tag */}
                      <div class="absolute bottom-3 left-3 bg-charcoal/80 backdrop-blur-sm text-cream px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                        {categories.find((c) => c.id === dish.category_id)?.name}
                      </div>
                    </div>

                    {/* Dish Details */}
                    <div class="p-5">
                      <div class="flex items-start justify-between gap-3 mb-1.5">
                        <h3 class="font-display font-bold text-xl text-charcoal dark:text-cream leading-tight">
                          {dish.name}
                        </h3>
                        <div class="font-display text-xl font-black text-charcoal dark:text-lemon tabular-nums shrink-0">
                          {formatNaira(dish.price_ngn)}
                        </div>
                      </div>

                      {/* Tags (Spicy, Vegetarian, etc.) */}
                      {dish.tags && dish.tags.length > 0 && (
                        <div class="flex flex-wrap gap-1.5 mb-2.5">
                          {dish.tags.map((t) => (
                            <span
                              key={t}
                              class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                t === 'Spicy'
                                  ? 'bg-chilli/15 text-chilli dark:text-red-400'
                                  : t === 'Vegetarian'
                                  ? 'bg-basil/15 text-basil dark:text-emerald-400'
                                  : 'bg-lavender-electric/20 text-lavender-deep dark:text-lavender-electric'
                              }`}
                            >
                              {t === 'Spicy' && '🌶️'}
                              {t === 'Vegetarian' && '🌱'}
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progressive disclosure description */}
                      <p
                        class={`text-xs text-muted dark:text-cream/70 leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {dish.description}
                      </p>

                      {dish.description.length > 90 && (
                        <button
                          type="button"
                          onClick={() => toggleDetails(dish.id)}
                          class="text-[11px] font-bold text-lavender-deep dark:text-lemon hover:underline mt-1 cursor-pointer focus:outline-none"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA Action: Tap 1 of 2-Tap Order Flow */}
                  <div class="p-5 pt-0">
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => handleAddToCart(dish)}
                      class={`w-full py-3 px-4 rounded-squircle-sm font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                        isSoldOut
                          ? 'bg-charcoal/10 text-charcoal/40 dark:bg-white/10 dark:text-white/40 cursor-not-allowed'
                          : 'bg-lemon text-charcoal hover:bg-yellow-300 active:scale-98 shadow-sm focus:outline-none focus:ring-2 focus:ring-charcoal'
                      }`}
                      aria-label={
                        isSoldOut
                          ? `${dish.name} is sold out`
                          : `Add ${dish.name} to order for ${formatNaira(dish.price_ngn)}`
                      }
                    >
                      {isSoldOut ? (
                        <span>Sold Out</span>
                      ) : (
                        <>
                          <span class="text-base leading-none">+</span>
                          <span>Add to Order</span>
                          <span class="text-[10px] font-normal opacity-70">· 1-Tap</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
