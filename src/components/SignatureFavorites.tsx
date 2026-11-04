import { useState, useRef, useEffect } from 'preact/hooks';
import type { MenuItem } from '../types';
import seedMenu from '../data/menu.json';
import { formatNaira } from '../lib/currency';

export default function SignatureFavorites() {
  const favorites: MenuItem[] = (seedMenu.items as MenuItem[]).filter(item => item.featured).slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % favorites.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + favorites.length) % favorites.length);
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const addToCartOptimistic = (dish: MenuItem) => {
    window.dispatchEvent(
      new CustomEvent('zesti:add-to-cart', {
        detail: { dish, quantity: 1 }
      })
    );
  };

  return (
    <section class="py-16 sm:py-24 bg-cream dark:bg-charcoal transition-colors overflow-hidden" aria-labelledby="signature-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div class="text-xs uppercase font-extrabold tracking-widest text-lavender-deep dark:text-lavender-electric mb-2 font-mono">
              ★ Curated Daily
            </div>
            <h2 id="signature-heading" class="font-display text-4xl sm:text-5xl text-charcoal dark:text-cream tracking-tight text-balance">
              Signature Favorites
            </h2>
            <p class="text-muted dark:text-cream/70 text-sm sm:text-base mt-2 max-w-lg">
              Perforated ticket plates made according to time-tested recipes. Tap '+' to order in two taps.
            </p>
          </div>

          {/* Carousel Desktop Controls */}
          <div class="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              class="hit-slop p-3 rounded-full border border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream hover:bg-lemon hover:border-lemon hover:text-charcoal transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-lemon"
              aria-label="Previous signature dish"
            >
              <svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              class="hit-slop p-3 rounded-full border border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream hover:bg-lemon hover:border-lemon hover:text-charcoal transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-lemon"
              aria-label="Next signature dish"
            >
              <svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {favorites.map((dish, idx) => (
            <article
              key={dish.id}
              class={`ticket-card squircle relative p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all duration-300 transform ${
                idx === activeIndex ? 'ring-4 ring-lemon/80 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{
                backgroundColor: '#8B7CFF',
                color: '#1B1B1F'
              }}
            >
              {/* Notches for perforated ticket appearance */}
              <div class="ticket-edge-left" aria-hidden="true" />
              <div class="ticket-edge-right" aria-hidden="true" />
              <div class="ticket-divider-line" aria-hidden="true" />

              {/* Upper Portion of Ticket: Circular Dish Photo & Badge */}
              <div class="pb-8">
                <div class="flex items-center justify-between mb-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-full bg-charcoal text-lemon text-[11px] font-bold tracking-wider uppercase">
                    Ticket #0{idx + 1}
                  </span>
                  <span class="font-mono text-xs font-bold text-charcoal/70">
                    ZESTI • TICKET
                  </span>
                </div>

                {/* Circular Dish Photo */}
                <div class="relative w-36 h-36 mx-auto my-3 rounded-full overflow-hidden border-4 border-charcoal/20 shadow-inner group">
                  <img
                    src={`/images/${dish.image_id}.webp`}
                    alt={dish.name}
                    width="240"
                    height="240"
                    loading="lazy"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onerror="this.onerror=null; this.src='/images/placeholder-dish.svg';"
                  />
                </div>
              </div>

              {/* Lower Portion of Ticket: Title, Price, Description, Add Action */}
              <div class="pt-8 flex flex-col justify-between flex-1">
                <div>
                  <h3 class="font-display text-2xl text-charcoal font-bold tracking-tight mb-2">
                    {dish.name}
                  </h3>
                  <p class="text-xs text-charcoal/85 line-clamp-2 leading-relaxed mb-4">
                    {dish.description}
                  </p>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-charcoal/15 mt-auto">
                  <div class="font-display text-2xl font-black text-charcoal tabular-nums">
                    {formatNaira(dish.price_ngn)}
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCartOptimistic(dish)}
                    class="hit-slop inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-charcoal text-lemon hover:bg-charcoal/90 active:scale-95 transition-all font-bold text-xs uppercase tracking-wider shadow-md focus:outline-none focus:ring-2 focus:ring-charcoal cursor-pointer min-h-[44px]"
                    aria-label={`Add ${dish.name} to order for ${formatNaira(dish.price_ngn)}`}
                  >
                    <span>+ Add</span>
                    <span class="text-[10px] opacity-75">1-Tap</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Dots Pager */}
        <div class="flex sm:hidden items-center justify-center gap-2 mt-8" aria-label="Carousel pagination">
          {favorites.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setActiveIndex(dotIdx)}
              class={`w-2.5 h-2.5 rounded-full transition-all ${
                dotIdx === activeIndex ? 'w-8 bg-lemon' : 'bg-charcoal/30 dark:bg-cream/30'
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
              aria-current={dotIdx === activeIndex ? 'true' : 'false'}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
