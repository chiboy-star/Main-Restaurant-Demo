import { useState, useEffect } from 'preact/hooks';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      class="hit-slop fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-30 w-11 h-11 rounded-full bg-cream text-charcoal dark:bg-charcoal-100 dark:text-cream shadow-xl border border-charcoal/20 dark:border-cream/20 flex items-center justify-center hover:bg-lemon hover:text-charcoal transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-lemon animate-fade-in"
      aria-label="Scroll back to top of page"
      title="Back to top"
    >
      <svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
