import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test('TC-API-CANCEL-01: DELETE /bookings/{id} cancels the booking and returns its seats', async ({
  createEvent,
  bookingsApi,
  eventsApi,
}) => {
  const event = await createEvent({ totalSeats: 10 });
  const kept = await bookingsApi.create(aBookingRequest(event.id, { quantity: 2 }));
  const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 3 }));

  const response = await bookingsApi.cancelRaw(booking.id);

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ success: true, message: 'Booking cancelled' });

  await test.step('the booking can no longer be found by id, by reference, or in the list', async () => {
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(404);
    expect((await bookingsApi.getByRefRaw(booking.bookingRef)).status()).toBe(404);
    const list = await (await bookingsApi.listRaw({ eventId: event.id })).json();
    expect(list.data.map((b: { id: number }) => b.id)).toEqual([kept.id]);
  });

  await test.step('exactly the 3 cancelled seats are back; the other booking is untouched', async () => {
    expect(await eventsApi.availableSeats(event.id)).toBe(8);
    expect((await bookingsApi.getByIdRaw(kept.id)).status()).toBe(200);
  });
});
