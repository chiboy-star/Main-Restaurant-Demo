import { useState, useEffect } from 'preact/hooks';
import DarkModeToggle from './DarkModeToggle';
import OpenNowBadge from './OpenNowBadge';

interface Props {
  currentPath?: string;
}

export default function Navbar({ currentPath = '/' }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Esc or route change
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  // Trap focus or handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Predictive back handling
      window.history.pushState({ mobileMenu: true }, '');
      const handlePop = () => setMobileMenuOpen(false);
      window.addEventListener('popstate', handlePop, { once: true });
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'About', href: '/about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' }
  ];

  const openCommandMenu = () => {
    window.dispatchEvent(new CustomEvent('zesti:open-command-menu'));
  };

  return (
    <nav class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3" aria-label="Main navigation">
      {/* Floating Pill Nav Container */}
      <div class="bg-cream/90 dark:bg-charcoal/90 backdrop-blur-md border border-charcoal/10 dark:border-cream/15 squircle shadow-lg shadow-charcoal/5 dark:shadow-black/20 px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <a
          href="/"
          class="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-lemon rounded-full p-1"
        >
          <div class="w-9 h-9 rounded-full bg-lemon text-charcoal flex items-center justify-center font-display font-bold text-xl group-hover:scale-105 transition-transform shadow-sm">
            Z
          </div>
          <div class="flex flex-col">
            <span class="font-display font-extrabold text-lg text-charcoal dark:text-cream tracking-tight leading-tight flex items-center gap-1.5">
              Zesti
              <span class="text-[10px] uppercase font-sans font-bold px-1.5 py-0.5 rounded-full bg-charcoal/10 dark:bg-cream/10 text-charcoal dark:text-cream">
                Demo
              </span>
            </span>
          </div>
        </a>

        {/* Live Open Now Chip (Desktop) */}
        <div class="hidden md:flex items-center">
          <OpenNowBadge compact={false} />
        </div>

        {/* Desktop Navigation Links */}
        <div class="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                class={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-charcoal text-lemon dark:bg-cream dark:text-charcoal font-semibold shadow-sm'
                    : 'text-charcoal dark:text-cream hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Right CTA Actions */}
        <div class="flex items-center gap-2">
          {/* Quick Search / Command Palette Trigger (Hit-slop 44px) */}
          <button
            type="button"
            onClick={openCommandMenu}
            class="hit-slop p-2 rounded-full text-charcoal dark:text-cream hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-lemon flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            aria-label="Search site and menu (Ctrl+K)"
            title="Search site and dishes (Ctrl+K)"
          >
            <svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span class="hidden sm:inline-block bg-charcoal/5 dark:bg-cream/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-muted">
              ⌘K
            </span>
          </button>

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* Book a Table Primary CTA */}
          <a
            href="/reserve"
            class="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-lavender-electric text-charcoal hover:bg-lavender-deep hover:text-white transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-lavender-deep min-h-[40px]"
          >
            Book a Table
          </a>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            class="lg:hidden hit-slop p-2.5 rounded-full text-charcoal dark:text-cream hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-lemon cursor-pointer"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Sheet (Swipe-to-dismiss / Keyboard focusable) */}
      {mobileMenuOpen && (
        <div
          class="fixed inset-0 z-[100] bg-charcoal/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <div
            class="absolute top-0 right-0 w-4/5 max-w-sm h-full bg-cream dark:bg-charcoal-100 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto safe-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header inside drawer */}
              <div class="flex items-center justify-between pb-4 border-b border-charcoal/10 dark:border-cream/10">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-lemon text-charcoal flex items-center justify-center font-display font-bold text-lg">
                    Z
                  </div>
                  <span class="font-display font-bold text-lg text-charcoal dark:text-cream">
                    Zesti Kitchen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  class="hit-slop p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-charcoal dark:text-cream cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Status in mobile menu */}
              <div class="py-4">
                <OpenNowBadge compact={false} />
              </div>

              {/* Navigation Links list with large touch targets */}
              <div class="flex flex-col gap-1 py-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    class="px-4 py-3 rounded-squircle-sm text-base font-semibold text-charcoal dark:text-cream hover:bg-lemon/30 dark:hover:bg-lemon/10 transition-colors flex items-center justify-between min-h-[48px]"
                  >
                    <span>{link.label}</span>
                    <span class="text-xs text-charcoal/40 dark:text-cream/40">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Bottom Actions inside drawer */}
            <div class="pt-6 border-t border-charcoal/10 dark:border-cream/10 flex flex-col gap-3">
              <a
                href="/reserve"
                onClick={() => setMobileMenuOpen(false)}
                class="w-full py-3.5 px-4 rounded-squircle-sm bg-lemon text-charcoal font-bold text-center uppercase tracking-wider shadow-sm active:scale-98 min-h-[48px] flex items-center justify-center"
              >
                Book a Table
              </a>
              <a
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                class="w-full py-3.5 px-4 rounded-squircle-sm bg-lavender-electric text-charcoal font-bold text-center uppercase tracking-wider shadow-sm active:scale-98 min-h-[48px] flex items-center justify-center"
              >
                Order Now
              </a>
              <a
                href="/for-owners"
                onClick={() => setMobileMenuOpen(false)}
                class="text-center text-xs text-muted dark:text-cream/60 py-1 underline"
              >
                Restaurant Owner Pitch & Setup
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
