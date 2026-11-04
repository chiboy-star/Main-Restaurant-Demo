import { useState, useEffect } from 'preact/hooks';
import { getCookieConsent, setCookieConsent } from '../lib/storage';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === null) {
      setShow(true);
    }
  }, []);

  const handleChoice = (accepted: boolean) => {
    setCookieConsent(accepted);
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and privacy preferences"
      class="fixed bottom-0 inset-x-0 z-50 bg-charcoal text-cream border-t border-lemon/30 px-4 py-2.5 shadow-2xl safe-pb"
    >
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p class="text-center sm:text-left text-cream/90">
          We use minimal local storage for your dining preferences and UTM campaign analytics. No personal tracking.
        </p>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleChoice(true)}
            class="px-3.5 py-1.5 rounded-full bg-lemon text-charcoal font-bold hover:bg-yellow-300 transition-colors cursor-pointer"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => handleChoice(false)}
            class="px-3 py-1.5 rounded-full border border-cream/20 text-cream/80 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Decline
          </button>
        </div>
      </div>
    </aside>
  );
}
