import { describe, it, expect } from 'vitest';
import { formatNaira } from '../src/lib/currency';

describe('Currency Formatter (formatNaira)', () => {
  it('formats whole naira amounts with the ₦ sign and no decimals', () => {
    expect(formatNaira(7500)).toBe('₦7,500');
    expect(formatNaira(4500)).toBe('₦4,500');
    expect(formatNaira(13000)).toBe('₦13,000');
    expect(formatNaira(20500)).toBe('₦20,500');
  });

  it('handles zero correctly', () => {
    expect(formatNaira(0)).toBe('₦0');
  });

  it('handles small amounts', () => {
    expect(formatNaira(500)).toBe('₦500');
  });

  it('handles edge cases safely', () => {
    expect(formatNaira(NaN)).toBe('₦0');
    expect(formatNaira(null as any)).toBe('₦0');
    expect(formatNaira(undefined as any)).toBe('₦0');
  });
});

