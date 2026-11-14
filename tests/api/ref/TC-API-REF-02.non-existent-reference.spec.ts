import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe('TC-API-REF-02: GET /bookings/ref/{ref} returns 404 for a reference that does not exist', () => {
  test('unknown reference', async ({ bookingsApi }) => {
    const response = await bookingsApi.getByRefRaw('NOPE-000000');

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ success: false, error: 'Booking with reference "NOPE-000000" not found' });
  });

  test('reference of a cancelled booking', async ({ createEvent, bookingsApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));
    await bookingsApi.cancel(booking.id);

    const response = await bookingsApi.getByRefRaw(booking.bookingRef);

    expect(response.status()).toBe(404);
  });
});
