import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe("TC-API-CANCEL-04: DELETE /bookings/{id} cannot cancel someone else's booking", () => {
  test('another user gets 404 and the booking survives', async ({ createEvent, bookingsApi, eventsApi, otherUserBookingsApi }) => {
    const event = await createEvent({ totalSeats: 10 });
    const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 2 }));

    const response = await otherUserBookingsApi.cancelRaw(booking.id);

    expect(response.status()).toBe(404);
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(200);
    expect(await eventsApi.availableSeats(event.id)).toBe(8);
  });

  test('no token gets 401 and the booking survives', async ({ createEvent, bookingsApi, anonymousApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await anonymousApi.delete(`bookings/${booking.id}`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' });
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(200);
  });
});
