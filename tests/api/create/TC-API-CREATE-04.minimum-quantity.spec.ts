import { test, expect } from '../../../src/fixtures';
import { aBookingRequest, TICKET_LIMITS } from '../../../src/data/booking.factory';

test('TC-API-CREATE-04: POST /bookings with the minimum quantity (1) returns the complete booking', async ({
  createEvent,
  bookingsApi,
  eventsApi,
}) => {
  const event = await createEvent({ price: 250, totalSeats: 25 });
  const input = aBookingRequest(event.id, { quantity: TICKET_LIMITS.min });

  const response = await bookingsApi.createRaw({ ...input });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.message).toBe('Booking confirmed!');

  const booking = body.data;
  expect(booking).toMatchObject({
    eventId: event.id,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    quantity: 1,
    totalPrice: '250',
    status: 'confirmed',
  });
  expect(booking.id).toEqual(expect.any(Number));
  expect(booking.userId).toEqual(expect.any(Number));
  // Documented as EVT-XXXXXX; actually <first letter of the event title>-<6 characters>.
  expect(booking.bookingRef).toMatch(/^[A-Z]-[A-Z0-9]{6}$/);
  expect(booking.bookingRef[0]).toBe(event.title[0].toUpperCase());
  expect(new Date(booking.createdAt).getTime()).not.toBeNaN();
  expect(booking.event).toMatchObject({ id: event.id, title: event.title });

  expect(await eventsApi.availableSeats(event.id)).toBe(24);
});
