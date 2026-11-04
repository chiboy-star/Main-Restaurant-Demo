import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  buildWhatsAppReservationMessage,
  buildWhatsAppReservationUrl
} from '../src/lib/whatsapp';

describe('WhatsApp Message Builders', () => {
  it('formats order message matching exact specification', () => {
    const msg = buildWhatsAppOrderMessage({
      businessPhone: '2348000000000',
      restaurantName: 'Zesti Kitchen (Demo)',
      items: [
        { name: 'Jollof Rice and Chicken', quantity: 2, price_ngn: 6500 },
        { name: 'Suya Platter', quantity: 1, price_ngn: 7500 }
      ],
      totalNgn: 20500,
      mode: 'dine_in',
      tableNo: '12',
      customerName: 'Chinedu O.'
    });

    const expected = [
      'Hi Zesti Kitchen (Demo), I would like to order:',
      '2 x Jollof Rice and Chicken – ₦13,000',
      '1 x Suya Platter – ₦7,500',
      'Total: ₦20,500',
      'Table 12',
      'Name: Chinedu O.'
    ].join('\n');

    expect(msg).toBe(expected);
  });

  it('formats delivery order correctly with address', () => {
    const msg = buildWhatsAppOrderMessage({
      businessPhone: '2348000000000',
      items: [{ name: 'Suya Platter', quantity: 1, price_ngn: 7500 }],
      totalNgn: 7500,
      mode: 'delivery',
      deliveryAddress: '15 Admiralty Way, Lekki',
      customerName: 'Amina B.'
    });

    expect(msg).toContain('Delivery to: 15 Admiralty Way, Lekki');
    expect(msg).toContain('Name: Amina B.');
  });

  it('builds valid URL-encoded wa.me link with UTM parameters', () => {
    const url = buildWhatsAppOrderUrl({
      businessPhone: '08000000000',
      items: [{ name: 'Suya Platter', quantity: 1, price_ngn: 7500 }],
      totalNgn: 7500,
      mode: 'pickup',
      customerName: 'Alex',
      utmSource: 'instagram',
      utmMedium: 'bio',
      utmCampaign: 'promo'
    });

    expect(url.startsWith('https://wa.me/2348000000000?text=')).toBe(true);
    expect(url).toContain('utm_source=instagram');
    expect(url).toContain('utm_campaign=promo');
  });

  it('formats reservation message matching exact specification', () => {
    const msg = buildWhatsAppReservationMessage({
      businessPhone: '2348000000000',
      partySize: 4,
      dayDate: 'Fri 7 Nov',
      time: '7:00 PM',
      customerName: 'Tunde'
    });

    expect(msg).toBe('Hi, I would like to book a table for 4 on Fri 7 Nov at 7:00 PM. Name: Tunde.');
  });

  it('builds valid URL-encoded reservation link with normalised phone', () => {
    const url = buildWhatsAppReservationUrl({
      businessPhone: '+2348000000000',
      partySize: 2,
      dayDate: 'Sat 8 Nov',
      time: '8:00 PM',
      customerName: 'Sade'
    });

    expect(url.startsWith('https://wa.me/2348000000000?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('Hi, I would like to book a table for 2 on Sat 8 Nov at 8:00 PM. Name: Sade.'));
  });
});
