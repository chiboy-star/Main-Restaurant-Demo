import { useState } from 'preact/hooks';
import defaultSettings from '../data/settings.json';

export default function MapFacade() {
  const [loaded, setLoaded] = useState(false);

  // Address: Demo Street, Lekki Phase 1, Lagos
  const mapEmbedUrl = `https://maps.google.com/maps?q=${defaultSettings.geo.lat},${defaultSettings.geo.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div class="relative w-full aspect-[16/9] max-h-[450px] rounded-squircle overflow-hidden border border-charcoal/15 dark:border-cream/15 shadow-xl bg-charcoal/10">
      {loaded ? (
        <iframe
          title="Zesti Kitchen Location Map"
          src={mapEmbedUrl}
          class="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <div class="relative w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-tr from-charcoal-200 via-charcoal to-charcoal-100 text-cream">
          {/* Decorative Map Grid Graphics */}
          <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#F5E663_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true" />
          
          <div class="relative z-10 max-w-sm flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-lemon text-charcoal flex items-center justify-center text-xl shadow-lg">
              📍
            </div>
            <h3 class="font-display text-2xl font-bold text-cream">
              Zesti Kitchen Lekki
            </h3>
            <p class="text-xs text-cream/70">
              {defaultSettings.address}
            </p>
            <button
              type="button"
              onClick={() => setLoaded(true)}
              class="mt-2 px-6 py-3 rounded-full bg-lemon text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-yellow-300 transition-all shadow-md active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white min-h-[44px]"
            >
              Click to Load Interactive Map
            </button>
            <span class="text-[10px] text-cream/50">
              Zero cookies or scripts loaded until clicked.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
