import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe("TC-API-REF-03: GET /bookings/ref/{ref} protects other users' bookings", () => {
  test('another user gets 403 and no booking data', async ({ createEvent, bookingsApi, otherUserBookingsApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await otherUserBookingsApi.getByRefRaw(booking.bookingRef);

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'You do not own this booking' });
    expect(JSON.stringify(body)).not.toContain(booking.customerEmail);
  });

  test('no token gets 401', async ({ createEvent, bookingsApi, anonymousApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await anonymousApi.get(`bookings/ref/${booking.bookingRef}`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' });
  });
});
