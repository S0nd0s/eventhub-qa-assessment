import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test('TC-API-GET-01: GET /bookings/{id} returns the booking with its event', async ({ createEvent, bookingsApi }) => {
  const event = await createEvent({ price: 100 });
  const input = aBookingRequest(event.id, { quantity: 4 });
  const booking = await bookingsApi.create(input);

  const response = await bookingsApi.getByIdRaw(booking.id);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data).toMatchObject({
    id: booking.id,
    eventId: event.id,
    bookingRef: booking.bookingRef,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    quantity: 4,
    totalPrice: '400',
    status: 'confirmed',
  });
  expect(body.data.event).toMatchObject({ id: event.id, title: event.title, venue: event.venue, city: event.city });
});
