/**
 * Formats an amount in Nigerian Naira (NGN).
 * Requirements:
 * - Uses Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
 * - Shows ₦ with no decimals (e.g. ₦7,500)
 * - Tabular numbers styling support
 */

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0
});

export function formatNaira(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  return nairaFormatter.format(amount).replace('NGN', '₦').trim();
}
