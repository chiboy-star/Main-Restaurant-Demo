/**
 * Normalises Nigerian phone numbers.
 * Requirements:
 * Accepts:
 *   - "0803..."
 *   - "+234803..."
 *   - "234803..."
 *   - "803..." (10 digits)
 * Formats to "234803..." without '+' or spaces for wa.me links.
 */

export function normalizeNigerianPhone(input: string): string {
  if (!input) return '';
  // Remove spaces, hyphens, parentheses, and plus sign
  let cleaned = input.replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('234')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '234' + cleaned.slice(1);
  }
  if (cleaned.length === 10) {
    return '234' + cleaned;
  }
  return cleaned;
}

export function formatTelLink(input: string): string {
  const normalized = normalizeNigerianPhone(input);
  return `tel:+${normalized}`;
}

export function formatDisplayPhone(input: string): string {
  const norm = normalizeNigerianPhone(input);
  if (norm.startsWith('234') && norm.length === 13) {
    // 234 803 123 4567
    return `+${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6, 9)} ${norm.slice(9)}`;
  }
  return input;
}
