import { useState, useMemo } from 'preact/hooks';
import defaultSettings from '../data/settings.json';
import { normalizeNigerianPhone } from '../lib/phone';
import { buildWhatsAppReservationUrl } from '../lib/whatsapp';
import { generateIdempotencyKey, saveReservation, captureUtmParams } from '../lib/storage';
import type { ReservationPayload } from '../types';

export default function ReservationForm() {
  // Defaults pre-filled to cut decisions (Hick's law)
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('7:00 PM');
  const [name, setName] = useState<string>('Alex Johnson');
  const [phone, setPhone] = useState<string>('08030000000');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingSuccess, setBookingSuccess] = useState<ReservationPayload | null>(null);
  const [copiedBooking, setCopiedBooking] = useState(false);

  // Available Time Slot Chips
  const timeSlots = [
    '12:30 PM',
    '1:30 PM',
    '2:30 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM'
  ];

  // Guest party options
  const guestOptions = [1, 2, 4, 6, 8, 10];

  const formattedDayDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }, [selectedDate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please provide your name for the table reservation.';
    if (!phone.trim()) {
      newErrors.phone = 'Please provide a valid phone number.';
    } else if (normalizeNigerianPhone(phone).length < 10) {
      newErrors.phone = 'Please enter a valid Nigerian mobile number (e.g. 08031234567).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Flow: Tap 2 of 2-Tap Reservation
  const handleConfirmReservation = (e?: Event) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const idempotencyKey = generateIdempotencyKey();
    const reservationId = 'RES-' + Math.floor(100000 + Math.random() * 900000);

    const payload: ReservationPayload = {
      id: reservationId,
      idempotency_key: idempotencyKey,
      name,
      phone: normalizeNigerianPhone(phone),
      party_size: partySize,
      starts_at: `${selectedDate} ${selectedTime}`,
      notes: notes.trim() || undefined,
      status: 'new',
      created_at: new Date().toISOString()
    };

    saveReservation(payload);
    setBookingSuccess(payload);

    const utm = captureUtmParams();

    const waUrl = buildWhatsAppReservationUrl({
      businessPhone: defaultSettings.whatsapp,
      partySize,
      dayDate: formattedDayDate,
      time: selectedTime,
      customerName: name,
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign
    });

    // Open WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const copyBookingDetails = () => {
    const text = `Zesti Kitchen Reservation\nTable for ${partySize}\nDate: ${formattedDayDate} at ${selectedTime}\nName: ${name}\nRef: ${bookingSuccess?.id}`;
    navigator.clipboard.writeText(text);
    setCopiedBooking(true);
    setTimeout(() => setCopiedBooking(false), 3000);
  };

  const downloadIcsCalendar = () => {
    const startIso = selectedDate.replace(/-/g, '') + 'T190000Z';
    const endIso = selectedDate.replace(/-/g, '') + 'T210000Z';
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Zesti Kitchen//Table Booking//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Dinner at Zesti Kitchen (Table for ${partySize})`,
      `DESCRIPTION:Reservation under ${name}. Reference: ${bookingSuccess?.id}`,
      `LOCATION:${defaultSettings.address}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zesti-reservation-${selectedDate}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div class="max-w-xl mx-auto bg-white dark:bg-charcoal-100 rounded-squircle p-6 sm:p-10 shadow-xl border border-charcoal/10 dark:border-cream/10">
      
      {bookingSuccess ? (
        <div class="space-y-6 text-center animate-fade-in" role="alert">
          <div class="w-16 h-16 mx-auto rounded-full bg-basil/20 text-basil flex items-center justify-center text-3xl">
            ✓
          </div>

          <div>
            <span class="text-xs font-mono uppercase tracking-widest text-basil font-bold">
              Booking Prefilled & Logged
            </span>
            <h2 class="font-display text-3xl font-bold text-charcoal dark:text-cream mt-1">
              Table Reserved!
            </h2>
            <p class="text-xs text-muted dark:text-cream/60 mt-1">
              Reservation Reference: <strong class="font-mono text-charcoal dark:text-lemon">{bookingSuccess.id}</strong>
            </p>
          </div>

          <div class="p-5 rounded-squircle-sm bg-cream dark:bg-charcoal-50 border border-charcoal/10 dark:border-cream/10 text-left text-sm space-y-2">
            <div class="flex justify-between border-b border-charcoal/10 pb-2">
              <span class="text-muted dark:text-cream/70">Guests</span>
              <strong class="text-charcoal dark:text-cream">{bookingSuccess.party_size} People</strong>
            </div>
            <div class="flex justify-between border-b border-charcoal/10 pb-2">
              <span class="text-muted dark:text-cream/70">Date & Time</span>
              <strong class="text-charcoal dark:text-cream">{formattedDayDate} at {selectedTime}</strong>
            </div>
            <div class="flex justify-between border-b border-charcoal/10 pb-2">
              <span class="text-muted dark:text-cream/70">Name</span>
              <strong class="text-charcoal dark:text-cream">{bookingSuccess.name}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-muted dark:text-cream/70">Location</span>
              <span class="text-xs font-medium text-charcoal dark:text-cream">{defaultSettings.address}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={copyBookingDetails}
              class="w-full sm:flex-1 py-3 px-4 rounded-full border border-charcoal/20 dark:border-cream/20 text-xs font-bold uppercase tracking-wider text-charcoal dark:text-cream hover:bg-black/5 cursor-pointer min-h-[44px]"
            >
              {copiedBooking ? '✓ Copied Details' : 'Copy Booking Details'}
            </button>

            <button
              type="button"
              onClick={downloadIcsCalendar}
              class="w-full sm:flex-1 py-3 px-4 rounded-full bg-lemon text-charcoal text-xs font-bold uppercase tracking-wider hover:bg-yellow-300 shadow cursor-pointer min-h-[44px]"
            >
              Add to Calendar (.ics)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setBookingSuccess(null)}
            class="text-xs text-muted dark:text-cream/60 underline hover:text-charcoal"
          >
            Make another booking
          </button>
        </div>
      ) : (
        <form onSubmit={handleConfirmReservation} class="space-y-6">
          
          {/* Quick Party Size Chips (Tap 1 Step) */}
          <div>
            <label class="block text-xs font-mono uppercase tracking-wider font-bold text-charcoal dark:text-cream mb-2">
              Party Size (Guests)
            </label>
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Select party size">
              {guestOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPartySize(num)}
                  class={`hit-slop px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                    partySize === num
                      ? 'bg-charcoal text-lemon dark:bg-cream dark:text-charcoal shadow-sm scale-105'
                      : 'bg-charcoal/5 dark:bg-charcoal-50 text-charcoal dark:text-cream border border-charcoal/10 hover:bg-lemon/30'
                  }`}
                  aria-pressed={partySize === num}
                >
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label for="booking-date" class="block text-xs font-mono uppercase tracking-wider font-bold text-charcoal dark:text-cream mb-2">
              Date ({formattedDayDate})
            </label>
            <input
              id="booking-date"
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onInput={(e) => setSelectedDate((e.target as HTMLInputElement).value)}
              required
              class="w-full px-4 py-3 rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon min-h-[48px]"
            />
          </div>

          {/* Time Slot Chips */}
          <div>
            <label class="block text-xs font-mono uppercase tracking-wider font-bold text-charcoal dark:text-cream mb-2">
              Available Time Slots (Tap 1)
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Select time slot">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  class={`hit-slop py-2.5 px-3 rounded-squircle-sm text-xs font-bold transition-all text-center cursor-pointer min-h-[44px] ${
                    selectedTime === slot
                      ? 'bg-lemon text-charcoal ring-2 ring-charcoal shadow-sm'
                      : 'bg-charcoal/5 dark:bg-charcoal-50 text-charcoal dark:text-cream border border-charcoal/10 hover:bg-white'
                  }`}
                  aria-pressed={selectedTime === slot}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Name & Phone */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="booking-name" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                Your Name *
              </label>
              <input
                id="booking-name"
                type="text"
                value={name}
                onInput={(e) => {
                  setName((e.target as HTMLInputElement).value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                required
                class={`w-full px-4 py-2.5 rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50 border text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon min-h-[44px] ${
                  errors.name ? 'border-chilli ring-1 ring-chilli' : 'border-charcoal/15 dark:border-cream/15'
                }`}
              />
              {errors.name && (
                <p class="text-chilli text-xs mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label for="booking-phone" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
                WhatsApp / Mobile *
              </label>
              <input
                id="booking-phone"
                type="tel"
                value={phone}
                onInput={(e) => {
                  setPhone((e.target as HTMLInputElement).value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                required
                class={`w-full px-4 py-2.5 rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50 border text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon min-h-[44px] ${
                  errors.phone ? 'border-chilli ring-1 ring-chilli' : 'border-charcoal/15 dark:border-cream/15'
                }`}
              />
              {errors.phone && (
                <p class="text-chilli text-xs mt-1 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label for="booking-notes" class="block text-xs font-semibold text-charcoal dark:text-cream mb-1">
              Special Requests (Optional)
            </label>
            <input
              id="booking-notes"
              type="text"
              value={notes}
              onInput={(e) => setNotes((e.target as HTMLInputElement).value)}
              placeholder="e.g. Birthday anniversary, booth preferred"
              class="w-full px-4 py-2.5 rounded-squircle-sm bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/15 dark:border-cream/15 text-charcoal dark:text-cream text-sm focus:outline-none focus:ring-2 focus:ring-lemon"
            />
          </div>

          {/* CTA: Tap 2 of 2-Tap Reservation Flow */}
          <div class="pt-2">
            <button
              type="submit"
              class="w-full py-4 rounded-squircle bg-whatsapp text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 hover:opacity-95 active:scale-98 transition-all shadow-xl focus:outline-none focus:ring-2 focus:ring-whatsapp min-h-[48px] cursor-pointer"
            >
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
              </svg>
              <span>Confirm on WhatsApp (Tap 2)</span>
            </button>
            <p class="text-center text-[11px] text-muted dark:text-cream/50 mt-2">
              Instant confirmation • No upfront fees • Changes via WhatsApp
            </p>
          </div>

        </form>
      )}

    </div>
  );
}
