import { test, expect } from '../../../src/fixtures';
import { aBookingRequest, TICKET_LIMITS } from '../../../src/data/booking.factory';

test('TC-API-CREATE-03: POST /bookings with the maximum quantity (10) succeeds', async ({ createEvent, bookingsApi, eventsApi }) => {
  const event = await createEvent({ price: 250, totalSeats: 25 });

  const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id, { quantity: TICKET_LIMITS.max }) });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.message).toBe('Booking confirmed!');
  expect(body.data.quantity).toBe(10);
  expect(body.data.totalPrice).toBe('2500');
  expect(await eventsApi.availableSeats(event.id)).toBe(15);
});
