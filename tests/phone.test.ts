import { describe, it, expect } from 'vitest';
import { normalizeNigerianPhone, formatDisplayPhone } from '../src/lib/phone';

describe('Nigerian Phone Number Normaliser', () => {
  it('normalises standard local mobile numbers starting with 0', () => {
    expect(normalizeNigerianPhone('08031234567')).toBe('2348031234567');
    expect(normalizeNigerianPhone('08129876543')).toBe('2348129876543');
    expect(normalizeNigerianPhone('09012345678')).toBe('2349012345678');
  });

  it('normalises international format with plus sign', () => {
    expect(normalizeNigerianPhone('+2348031234567')).toBe('2348031234567');
  });

  it('handles numbers with spaces, hyphens and brackets', () => {
    expect(normalizeNigerianPhone('0803 123 4567')).toBe('2348031234567');
    expect(normalizeNigerianPhone('+234 (803) 123-4567')).toBe('2348031234567');
  });

  it('normalises 10-digit numbers missing leading zero', () => {
    expect(normalizeNigerianPhone('8031234567')).toBe('2348031234567');
  });

  it('formats display phone gracefully', () => {
    expect(formatDisplayPhone('08031234567')).toBe('+234 803 123 4567');
  });
});

