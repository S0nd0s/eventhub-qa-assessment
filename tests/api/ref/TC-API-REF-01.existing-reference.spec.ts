import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe('TC-API-REF-01: GET /bookings/ref/{ref} returns the booking for an existing reference', () => {
  test('the full booking with its event is returned', async ({ createEvent, bookingsApi }) => {
    const event = await createEvent({ price: 250 });
    const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 2 }));

    const response = await bookingsApi.getByRefRaw(booking.bookingRef);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      id: booking.id,
      bookingRef: booking.bookingRef,
      eventId: event.id,
      quantity: 2,
      totalPrice: '500',
      status: 'confirmed',
      customerName: booking.customerName,
    });
    expect(body.data.event).toMatchObject({ id: event.id, title: event.title });
  });

  test('the reference is not case-sensitive', async ({ createEvent, bookingsApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await bookingsApi.getByRefRaw(booking.bookingRef.toLowerCase());

    expect(response.status()).toBe(200);
    expect((await response.json()).data.id).toBe(booking.id);
  });
});
