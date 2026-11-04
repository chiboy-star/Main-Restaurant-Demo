import { describe, it, expect } from 'vitest';
import { computeOpenNow, parseTimeToMinutes, formatMinutesTo12h } from '../src/lib/opennow';
import type { RestaurantSettings } from '../src/types';

describe('Open Now Logic (Africa/Lagos Timezone)', () => {
  const baseSettings: RestaurantSettings = {
    name: 'Zesti Kitchen (Demo)',
    shortName: 'Zesti',
    tagline: 'Fresh, fast, and fully yours.',
    whatsapp: '2348000000000',
    phone: '08000000000',
    address: 'Demo Street, Lekki',
    geo: { lat: 6.4474, lng: 3.4723 },
    bank_name: 'Demo Bank',
    account_number: '0123456789',
    account_name: 'Zesti Kitchen Ltd',
    temporarily_closed: false,
    hours: [
      { weekday: 0, open: '12:00', close: '21:00', closed: false }, // Sun
      { weekday: 1, open: '11:00', close: '22:00', closed: false }, // Mon
      { weekday: 2, open: '11:00', close: '22:00', closed: false }, // Tue
      { weekday: 3, open: '11:00', close: '22:00', closed: false }, // Wed
      { weekday: 4, open: '11:00', close: '22:00', closed: false }, // Thu
      { weekday: 5, open: '11:00', close: '23:30', closed: false }, // Fri
      { weekday: 6, open: '11:00', close: '23:30', closed: false }  // Sat
    ],
    holidays: [
      { date: '2026-12-25', label: 'Christmas Day', closed: true }
    ],
    updated_at: '2026-11-04T12:00:00Z'
  };

  it('computes Open during normal operating hours on Wednesday 2 PM', () => {
    // 2026-11-04 is a Wednesday. UTC 13:00 is 14:00 (2 PM) in Lagos (UTC+1)
    const testDate = new Date('2026-11-04T13:00:00Z');
    const res = computeOpenNow(baseSettings, testDate);

    expect(res.isOpen).toBe(true);
    expect(res.statusText).toBe('Open');
    expect(res.detailText).toBe('closes 10 PM');
  });

  it('computes Closed before opening hours (e.g. Wednesday 9 AM)', () => {
    // UTC 08:00 is 09:00 in Lagos
    const testDate = new Date('2026-11-04T08:00:00Z');
    const res = computeOpenNow(baseSettings, testDate);

    expect(res.isOpen).toBe(false);
    expect(res.statusText).toBe('Closed');
    expect(res.detailText).toBe('opens 11 AM today');
  });

  it('computes Closed after hours (e.g. Thursday 10:30 PM)', () => {
    // 2026-11-05 (Thursday) UTC 21:30 is 22:30 in Lagos
    const testDate = new Date('2026-11-05T21:30:00Z');
    const res = computeOpenNow(baseSettings, testDate);

    expect(res.isOpen).toBe(false);
    expect(res.statusText).toBe('Closed');
    expect(res.detailText).toBe('opens 11 AM tomorrow');
  });

  it('handles Friday late closing at 11:30 PM', () => {
    // 2026-11-06 (Friday) UTC 22:00 is 23:00 in Lagos (before 23:30 close)
    const testDate = new Date('2026-11-06T22:00:00Z');
    const res = computeOpenNow(baseSettings, testDate);

    expect(res.isOpen).toBe(true);
    expect(res.detailText).toBe('closes 11:30 PM');
  });

  it('handles shift running after midnight (e.g. open 18:00 to 01:00 next day)', () => {
    const afterMidnightSettings: RestaurantSettings = {
      ...baseSettings,
      hours: [
        { weekday: 5, open: '18:00', close: '01:00', closed: false }, // Fri open to 1 AM Sat
        { weekday: 6, open: '12:00', close: '22:00', closed: false }
      ]
    };

    // 2026-11-07 (Saturday) UTC 23:30 Friday = 00:30 Saturday in Lagos (should still be Open from Friday shift)
    const testDate = new Date('2026-11-06T23:30:00Z');
    const res = computeOpenNow(afterMidnightSettings, testDate);

    expect(res.isOpen).toBe(true);
    expect(res.detailText).toBe('closes 1 AM');
  });

  it('handles holiday closures correctly', () => {
    // Christmas Day 2026-12-25 at 2 PM in Lagos
    const testDate = new Date('2026-12-25T13:00:00Z');
    const res = computeOpenNow(baseSettings, testDate);

    expect(res.isOpen).toBe(false);
    expect(res.isHoliday).toBe(true);
    expect(res.fullLabel).toContain('Christmas Day');
  });

  it('respects temporarily closed switch override', () => {
    const closedSettings: RestaurantSettings = {
      ...baseSettings,
      temporarily_closed: true
    };

    const testDate = new Date('2026-11-04T13:00:00Z');
    const res = computeOpenNow(closedSettings, testDate);

    expect(res.isOpen).toBe(false);
    expect(res.isTemporaryClosed).toBe(true);
    expect(res.detailText).toBe('Temporarily closed');
  });

  it('parses and formats time helpers properly', () => {
    expect(parseTimeToMinutes('11:00')).toBe(660);
    expect(parseTimeToMinutes('23:30')).toBe(1410);
    expect(formatMinutesTo12h(660)).toBe('11 AM');
    expect(formatMinutesTo12h(1410)).toBe('11:30 PM');
    expect(formatMinutesTo12h(60)).toBe('1 AM');
  });
});

