import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe("TC-API-GET-03: GET /bookings/{id} protects other users' bookings", () => {
  test('another user gets 403 and no booking data', async ({ createEvent, bookingsApi, otherUserBookingsApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await otherUserBookingsApi.getByIdRaw(booking.id);

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'You are not authorized to view this booking' });
    expect(JSON.stringify(body)).not.toContain(booking.customerEmail);
  });

  test('no token gets 401', async ({ createEvent, bookingsApi, anonymousApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await anonymousApi.get(`bookings/${booking.id}`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' });
  });
});
