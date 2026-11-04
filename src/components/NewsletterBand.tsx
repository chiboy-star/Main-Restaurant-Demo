import { useState } from 'preact/hooks';

export default function NewsletterBand() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      try {
        // Store locally or dispatch
        const stored = localStorage.getItem('zesti_subscribers_v1') || '[]';
        const list = JSON.parse(stored);
        list.push({ email, created_at: new Date().toISOString() });
        localStorage.setItem('zesti_subscribers_v1', JSON.stringify(list));
        setStatus('success');
        setEmail('');
      } catch (err) {
        setStatus('error');
        setErrorMessage('Failed to subscribe. Please try again.');
      }
    }, 400); // Under Doherty threshold
  };

  return (
    <section class="bg-lemon text-charcoal py-16 sm:py-20 relative overflow-hidden" aria-labelledby="newsletter-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto text-center flex flex-col items-center">
          
          {/* Line-Art Food Icons Row */}
          <div class="flex items-center justify-center gap-6 mb-4 text-charcoal/80" aria-hidden="true">
            {/* Fork & Knife Icon */}
            <svg class="w-7 h-7 fill-none stroke-current stroke-1.5" viewBox="0 0 24 24">
              <path d="M18 2v20M21 2v6a3 3 0 0 1-3 3M6 2v20M3 2v6a3 3 0 0 0 6 0V2" />
            </svg>
            {/* Sparkle / Star Icon */}
            <svg class="w-6 h-6 fill-none stroke-current stroke-1.5" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {/* Flame / Grill Icon */}
            <svg class="w-7 h-7 fill-none stroke-current stroke-1.5" viewBox="0 0 24 24">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>

          <h2 id="newsletter-heading" class="font-display text-3xl sm:text-5xl font-bold tracking-tight text-charcoal mb-3 text-balance">
            Stay Connected with Zesti Kitchen
          </h2>

          <p class="text-charcoal/80 text-sm sm:text-base max-w-lg mb-8">
            Get exclusive weekend grill drops, secret tasting dates, and new dish announcements. No spam. Unsubscribe anytime.
          </p>

          {status === 'success' ? (
            <div
              role="alert"
              class="w-full max-w-md p-4 rounded-squircle-sm bg-charcoal text-lemon font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <svg class="w-5 h-5 fill-none stroke-current stroke-2 text-basil" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>You’re on the list! Welcome to the Zesti inner circle.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} class="w-full max-w-md flex flex-col gap-2">
              <div class="flex flex-col sm:flex-row gap-2">
                <label for="newsletter-email" class="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onInput={(e) => {
                    setEmail((e.target as HTMLInputElement).value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="your.email@example.com"
                  required
                  class="flex-1 px-5 py-3.5 rounded-full bg-cream text-charcoal placeholder-charcoal/50 border border-charcoal/20 focus:outline-none focus:ring-2 focus:ring-charcoal font-medium text-sm min-h-[48px]"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  class="px-7 py-3.5 rounded-full bg-charcoal text-lemon font-bold text-xs uppercase tracking-wider hover:bg-charcoal/90 active:scale-95 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-charcoal disabled:opacity-50 min-h-[48px] cursor-pointer"
                >
                  {status === 'loading' ? 'Joining...' : 'Subscribe'}
                </button>
              </div>

              {status === 'error' && (
                <div role="alert" class="text-chilli font-bold text-xs flex items-center gap-1.5 justify-center mt-1">
                  <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <p class="text-[11px] text-charcoal/70 mt-2">
                We respect your inbox. Submissions are stored securely in zero-data local mode.
              </p>
            </form>
          )}

        </div>
      </div>
    </section>
  );
}
