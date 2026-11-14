import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

const invalidQuantities: { name: string; quantity: unknown }[] = [
  { name: '0 (below the minimum)', quantity: 0 },
  { name: '11 (above the maximum)', quantity: 11 },
  { name: '-1 (negative)', quantity: -1 },
  { name: '1.5 (not a whole number)', quantity: 1.5 },
  { name: '"two" (not a number)', quantity: 'two' },
];

test.describe('TC-API-CREATE-05: POST /bookings rejects a quantity outside 1–10', () => {
  for (const { name, quantity } of invalidQuantities) {
    test(`quantity ${name}`, async ({ createEvent, bookingsApi, eventsApi }) => {
      const event = await createEvent({ totalSeats: 20 });

      const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id), quantity });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContainEqual({ field: 'quantity', message: 'Quantity must be an integer between 1 and 10' });
      expect(await eventsApi.availableSeats(event.id)).toBe(20);
    });
  }
});
