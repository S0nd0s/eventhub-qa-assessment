import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe('TC-API-GET-02: GET /bookings/{id} for a booking that does not exist', () => {
  for (const id of [99999999, 0, -1]) {
    test(`id ${id} returns 404`, async ({ bookingsApi }) => {
      const response = await bookingsApi.getByIdRaw(id);

      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ success: false, error: `Booking with id ${id} not found` });
    });
  }

  test('a cancelled booking returns 404', async ({ createEvent, bookingsApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));
    await bookingsApi.cancel(booking.id);

    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(404);
  });

  test('BUG: a non-numeric id is a client error, not a server error', async ({ bookingsApi }) => {
    test.info().annotations.push({
      type: 'bug',
      description: 'GET /bookings/abc returns 500 Internal server error instead of 400/404',
    });

    const response = await bookingsApi.getByIdRaw('abc');

    expect([400, 404]).toContain(response.status());
  });
});
