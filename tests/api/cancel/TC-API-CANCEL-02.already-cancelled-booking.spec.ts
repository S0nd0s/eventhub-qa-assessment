import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test('TC-API-CANCEL-02: cancelling an already cancelled booking returns 404 and does not add seats twice', async ({
  createEvent,
  bookingsApi,
  eventsApi,
}) => {
  const event = await createEvent({ totalSeats: 10 });
  const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 3 }));
  await bookingsApi.cancel(booking.id);

  const response = await bookingsApi.cancelRaw(booking.id);

  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({ success: false, error: `Booking with id ${booking.id} not found` });
  expect(await eventsApi.availableSeats(event.id), 'seats must not exceed the total').toBe(10);
});
