import { formatNaira } from './currency';
import { normalizeNigerianPhone } from './phone';

export interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price_ngn: number;
}

export interface WhatsAppOrderParams {
  businessPhone: string;
  restaurantName?: string;
  items: WhatsAppOrderItem[];
  totalNgn: number;
  mode: 'dine_in' | 'pickup' | 'delivery';
  tableNo?: string;
  deliveryAddress?: string;
  customerName: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export function buildWhatsAppOrderMessage(params: WhatsAppOrderParams): string {
  const brand = params.restaurantName || 'Zesti Kitchen (Demo)';
  const lines: string[] = [
    `Hi ${brand}, I would like to order:`
  ];

  for (const item of params.items) {
    const lineTotal = item.quantity * item.price_ngn;
    lines.push(`${item.quantity} x ${item.name} – ${formatNaira(lineTotal)}`);
  }

  lines.push(`Total: ${formatNaira(params.totalNgn)}`);

  if (params.mode === 'dine_in') {
    lines.push(`Table ${params.tableNo || 'Not specified'}`);
  } else if (params.mode === 'pickup') {
    lines.push('Pickup');
  } else if (params.mode === 'delivery') {
    lines.push(`Delivery to: ${params.deliveryAddress || 'Not specified'}`);
  }

  lines.push(`Name: ${params.customerName}`);

  return lines.join('\n');
}

export function buildWhatsAppOrderUrl(params: WhatsAppOrderParams): string {
  const phone = normalizeNigerianPhone(params.businessPhone);
  const message = buildWhatsAppOrderMessage(params);
  let url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (params.utmSource) {
    url += `&utm_source=${encodeURIComponent(params.utmSource)}`;
  }
  if (params.utmMedium) {
    url += `&utm_medium=${encodeURIComponent(params.utmMedium)}`;
  }
  if (params.utmCampaign) {
    url += `&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  }

  return url;
}

export interface WhatsAppReservationParams {
  businessPhone: string;
  partySize: number;
  dayDate: string; // e.g. "Fri 7 Nov"
  time: string;    // e.g. "7:00 PM"
  customerName: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export function buildWhatsAppReservationMessage(params: WhatsAppReservationParams): string {
  return `Hi, I would like to book a table for ${params.partySize} on ${params.dayDate} at ${params.time}. Name: ${params.customerName}.`;
}

export function buildWhatsAppReservationUrl(params: WhatsAppReservationParams): string {
  const phone = normalizeNigerianPhone(params.businessPhone);
  const message = buildWhatsAppReservationMessage(params);
  let url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (params.utmSource) {
    url += `&utm_source=${encodeURIComponent(params.utmSource)}`;
  }
  if (params.utmMedium) {
    url += `&utm_medium=${encodeURIComponent(params.utmMedium)}`;
  }
  if (params.utmCampaign) {
    url += `&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  }

  return url;
}
