# Zesti Kitchen (Demo) – Production-Quality Mobile-First Restaurant Demo

A high-performance, mobile-first demo website for **Zesti Kitchen (Demo)**, a fictional contemporary Nigerian restaurant in Lekki Phase 1, Lagos. Built to pitch local food businesses and prove one single core promise: **order or reserve in two taps**.

---

## 🚀 The One Thing This Demo Proves

### 1. Order in Two Taps
- **Tap 1**: Tap `+ Add to Order` on any dish card (the sticky bottom cart bar appears instantly).
- **Tap 2**: Tap `Send on WhatsApp` (or send order directly from the sticky bar).
- **Result**: WhatsApp immediately opens prefilled with the full itemized order, naira totals, and table or delivery details. The order is simultaneously logged to the kitchen admin with a unique idempotency key.

### 2. Reserve in Two Taps
- **Tap 1**: Tap a ready-made time slot chip (pre-filled with smart defaults: tonight, 7:00 PM, 2 guests).
- **Tap 2**: Tap `Confirm on WhatsApp`.
- **Result**: WhatsApp opens with a pre-formatted reservation request, the booking is recorded in the admin portal, and an instant `.ics` calendar invite + copy details button are generated.

---

## 🛠️ Stack & Architecture

- **Framework**: [Astro 4](https://astro.build) (static output, near-zero JavaScript by default).
- **Interactive Islands**: [Preact](https://preactjs.com/) for interactive components (`MenuCatalog`, `CartSheet`, `ReservationForm`, `AdminDashboard`, `CommandMenu`, `DarkModeToggle`).
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with custom design tokens and fluid clamp typography.
- **Design System Tokens**:
  - `Lemon`: `#F5E663` (Primary CTA accent, badges, newsletter band)
  - `Electric Lavender`: `#8B7CFF` (Secondary accent, ticket cards, focus rings)
  - `Deep Lavender`: `#4B3BD1` (High-contrast accessible text/links on cream)
  - `Charcoal Black`: `#1B1B1F` (Light text, dark mode background, hero)
  - `Cream`: `#FFF8E6` (Light mode background)
  - `Chilli`: `#E8502F` (Appetite accent, sale badges, spicy tags, inline errors)
  - `Basil`: `#1F6F54` (Open now badge, success states)
  - `WhatsApp Green`: `#25D366` (Recognizable WhatsApp buttons only)
  - `Mist`: `#E9E6DD` (Borders, dividers, skeleton base)
- **Continuous Corners**: Squircle curvature (`corner-shape: squircle; border-radius: 28px;`) with graceful border-radius fallbacks.
- **Self-Hosted Typography**:
  - Display: `DM Serif Display` / `Abril Fatface` (self-hosted WOFF2, size-adjusted fallback).
  - Body & UI: `DM Sans` (self-hosted WOFF2 subset, `font-display: swap`).
  - Numbers: Tabular numbers enabled (`font-variant-numeric: tabular-nums`).
- **Hosting**: Cloudflare Pages (Free tier) with `_headers` and serverless functions for payment verification.
- **Database / Demo Mode**:
  - Demo mode active by default: If Supabase keys are omitted, the app hydrates from seeded `menu.json`, `settings.json`, and `localStorage` so the demo **never fails in front of a prospect**.
  - Supabase integration ready with RLS (public read of menu/hours; owner write; public insert-only for bookings, orders, and subscribers).

---

## 📋 Hard Rules Compliance (Non-Negotiable)

1. **Fictional Brand Labelled Demo**: Visible demo ribbon on every page, and "(Demo)" in every page title.
2. **No Fake Reviews or Testimonials**: No fake star ratings, star icons, or fabricated quotes anywhere. A clear placeholder links directly to a Google Business Profile.
3. **No Real Business Names or Numbers**: Default WhatsApp number sourced from `PUBLIC_WHATSAPP_NUMBER` (placeholder `2348000000000`). All addresses and banks are simulated.
4. **Noindex Guard**: Protected with `noindex, nofollow` in `public/robots.txt`, `public/_headers` (X-Robots-Tag), and HTML `<meta>` tags. A single config flag in `brand.json` (`noindex: false`) flips it for a real client.
5. **Test Mode Payments**: Every payment screen and bank transfer section is explicitly labelled **Test mode**.
6. **Free to Run**: Built on Cloudflare Pages free tier, Supabase free tier, and native `wa.me` click-to-chat links (no paid WhatsApp APIs).
7. **No Broken Images (Hard Rule 7)**: Verified via automated image pipeline and `scripts/validate-images.js`. Build fails if any referenced image is missing.
8. **Original Structure & Mood**: Borrows structural layout and high-contrast typography mood without copying proprietary imagery, copy, or brand names.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Public Variables (Client & Server)
PUBLIC_WHATSAPP_NUMBER=2348000000000
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Payment Gateways (Test Mode)
PAYSTACK_PUBLIC_KEY=pk_test_placeholder
PAYSTACK_SECRET_KEY=sk_test_placeholder
FLW_PUBLIC_KEY=FLWPUBK_TEST-placeholder
```

---

## 🏁 Quickstart & Setup

```bash
# 1. Install dependencies
npm install

# 2. Run image pipeline (downloads, validates long edge >= 1000px, converts to AVIF/WebP, computes BlurHash)
npm run process-images

# 3. Run automated tests (Unit tests for open-now, phone normalisation, WhatsApp builders, naira formatting)
npm test

# 4. Start local development server
npm run dev

# 5. Production build (Validates image integrity and compiles static output)
npm run build
```

---

## ☁️ Deployment to Cloudflare Pages

1. Push your repository to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository and configure build settings:
   - **Framework preset**: `None` or `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add environment variables under **Settings** > **Environment variables**.
5. Deploy! Cloudflare Pages will automatically respect `public/_headers` (applying `X-Robots-Tag: noindex` and immutable font cache rules).

### How to Flip Noindex for a Real Client
Open `brand.json` and change:
```json
{
  "noindex": false,
  "isDemo": false
}
```
And in `public/robots.txt`, update `Disallow: /` to `Allow: /`.

---

## 🏷️ White-Label Prospect Previews in Under 1 Hour

All client customization is centralized in **`brand.json`**:
- `name`: Brand name (e.g. "Mama Cass Grill")
- `colors`: Primary brand tokens
- `logo`: Path to client logo SVG/PNG
- `whatsappNumber`: Client's WhatsApp business line
- `address` & `geo`: Client's physical location in Lagos/Abuja
- `bankDetails`: Client's local bank transfer accounts

To build a private preview for a prospective restaurant:
1. Update `brand.json` with the prospect's details.
2. Deploy to a private, unguessable Cloudflare preview domain (e.g. `preview-98234.pages.dev`).
3. Keep `noindex: true` enabled. Always obtain the restaurant's written consent before using their trade name or logo.

---

## 📊 Comprehensive UX Checklist Status

### 20 UX Tips
| # | UX Tip | Status | Implementation Details |
|---|---|---|---|
| 1 | Skeleton loaders | Implemented | Shimmer skeleton placeholders on menu dish cards and gallery items |
| 2 | Optimistic updates | Implemented | Immediate UI response when adding to cart, toggling sold-out, or saving settings |
| 3 | Command menu | Implemented | `Ctrl+K` / `⌘K` command palette with search across dishes, prices, and navigation |
| 4 | Shortcut hints | Implemented | `⌘K` badge in header search button, keyboard navigation hints in modal footers |
| 5 | Undo toasts | Implemented | Floating undo notification after deleting dishes or removing items from cart |
| 6 | Stale-while-revalidate | Implemented | Cached local menu/settings render instantly; fresh updates sync quietly in background |
| 7 | Pre-rendering | Implemented | All public marketing routes built as static HTML (`output: 'static'`) |
| 8 | BlurHash placeholders | Implemented | Generated in image pipeline and written to `images.json` |
| 9 | View transitions | Implemented | Astro View Transitions API enabled for seamless SPA-like page changes |
| 10 | Swipe-to-dismiss sheets | Implemented | Touch event listeners on cart bottom drawer and mobile menu sheet |
| 11 | Interruptible animations | Implemented | CSS transitions and transform animations cancelable mid-motion |
| 12 | Predictive back | Implemented | Browser and Android back buttons close open sheets before leaving the route |
| 13 | Hit slop (44–48px) | Implemented | `.hit-slop` utility padding ensuring every icon and button meets WCAG touch criteria |
| 14 | Safe area insets | Implemented | `env(safe-area-inset-bottom)` applied to sticky cart bar and floating action buttons |
| 15 | One-time code autofill | Implemented | `autocomplete="one-time-code"` and `inputmode="numeric"` on admin login OTP |
| 16 | Tabular numbers | Implemented | `font-variant-numeric: tabular-nums` applied to prices, totals, quantities, and hours |
| 17 | Balanced headlines | Implemented | `text-wrap: balance` on all primary headlines and section titles |
| 18 | Continuous corners | Implemented | `.squircle` class with `corner-shape: squircle` and border-radius fallbacks |
| 19 | Idempotency keys | Implemented | `generateIdempotencyKey()` UUID attached to all order, booking, and payment payloads |
| 20 | Amazon safe triangle | Implemented | Hover-intent protection on desktop dropdowns and command palette |

### 20 Features
| # | Feature | Status | Implementation Details |
|---|---|---|---|
| 1 | Dark mode toggle | Implemented | Header toggle with zero flash on initial load (`localStorage` + inline script) |
| 2 | Simple cookie banner | Implemented | One-line Accept/Decline banner for local preferences and UTM analytics |
| 3 | Site search | Implemented | Instant typeahead search on `/menu` plus site-wide search in command palette |
| 4 | Back-to-top button | Implemented | Appears after scrolling 400px down on long pages |
| 5 | Mobile menus | Implemented | Full-height slide-out drawer with 48px tap targets and route shortcuts |
| 6 | Loading animations | Implemented | Non-blocking micro-spinners and pulse indicators |
| 7 | Hover states | Implemented | Interactive hover, active scale-down, and focus rings across all links and buttons |
| 8 | Scroll progress bar | Implemented | Thin Lemon bar at the very top tracking viewport reading progress |
| 9 | Copy buttons | Implemented | One-click copy for bank account numbers, booking references, and order IDs |
| 10 | Print stylesheet | Implemented | Dedicated `@media print` rules for menu printing, QR cards, and receipts |
| 11 | Sticky headers | Implemented | Floating pill nav, sticky category chips, and bottom cart bar |
| 12 | Skip to content | Implemented | First focusable anchor `#main-content` for keyboard accessibility |
| 13 | Password visibility toggle | Not Applicable | Passwordless authentication used (6-digit emailed OTP); no password field exists |
| 14 | UTM tracking | Implemented | Captures `utm_source`, `utm_medium`, `utm_campaign`, and appends to WhatsApp links |
| 15 | Form success state | Implemented | Delightful confirmation card with calendar download and summary |
| 16 | Form error state | Implemented | Inline field error messages with icon and high-contrast chilli styling |
| 17 | Confirmation modals | Implemented | Destructive action confirmation when deleting menu dishes in admin |
| 18 | Last updated date | Implemented | Live date stamp in footer and menu header tied to `updated_at` |
| 19 | Expandable FAQ | Implemented | W3C ARIA disclosure pattern on `/faq` and homepage |
| 20 | Floating contact | Implemented | WhatsApp and call floating action buttons positioned above the cart bar |

### 17 Laws of UX
1. **Aesthetic-Usability Effect**: High-contrast typography, warm imagery, and responsive feedback build trust.
2. **Hick's Law**: 4–6 category chips and pre-filled booking defaults cut cognitive decision time.
3. **Fitts's Law**: Large full-width buttons in the bottom mobile thumb zone for primary checkout actions.
4. **Jakob's Law**: Familiar bottom cart drawer, WhatsApp green icons, and top search patterns.
5. **Miller's Law**: Menu dishes organized into digestible chunks with progressive disclosure.
6. **Doherty Threshold**: All state updates, cart actions, and sheet animations resolve in < 400ms.
7. **Proximity**: Prices and add buttons sit adjacent to dish names.
8. **Similarity**: Uniform button styles across hierarchy levels.
9. **Common Region**: Distinct cards, tickets, and sheets group related culinary items.
10. **Visual Hierarchy**: Giant serif headline → dish photo → primary CTA → secondary links.
11. **Progressive Disclosure**: Detailed recipe descriptions expand on demand.
12. **Recognition Over Recall**: Persistent sticky cart summary, recent selections always visible.
13. **Von Restorff Effect**: Lemon primary action button stands out; Chef's Pick badges draw focus.
14. **Peak-End Rule**: Delightful reservation confirmation card with `.ics` calendar download.
15. **Goal-Gradient Effect**: Clear progress indicators in cart and booking steps.
16. **Serial Position Effect**: Best-selling signatures placed first and last in ticket carousel and nav.
17. **Tesler's Law**: System absorbs phone number formatting and Nigerian timezone calculation automatically.

---

## 🧪 Testing Suite

- **Unit Tests (`vitest`)**:
  - `tests/currency.test.ts`: Naira formatting with ₦ and zero decimals.
  - `tests/phone.test.ts`: Normalization of 0803..., +234803..., and bracketed phone numbers.
  - `tests/opennow.test.ts`: Africa/Lagos time calculations, midnight closing, holidays, and temporary closures.
  - `tests/whatsapp.test.ts`: Formatted WhatsApp order and reservation message strings.
- **Link & Image Checker**: `scripts/check-links.js` scans all templates and fails the build on any broken route or missing asset.
- **Image Validator**: `scripts/validate-images.js` enforces Hard Rule 7.
- **E2E Smoke Tests (`playwright`)**: `tests/smoke.spec.ts` verifies the two-tap order flow and two-tap reservation on an iPhone viewport.

