import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe('TC-API-CREATE-01: POST /bookings for an event the user cannot book returns 404', () => {
  test('event id does not exist', async ({ bookingsApi }) => {
    const response = await bookingsApi.createRaw({ ...aBookingRequest(99999999) });

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ success: false, error: 'Event with id 99999999 not found' });
  });

  test('event was deleted', async ({ createEvent, eventsApi, bookingsApi }) => {
    const event = await createEvent();
    await eventsApi.delete(event.id);

    const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id) });

    expect(response.status()).toBe(404);
  });

  test("event belongs to another user (accounts are isolated)", async ({ createEvent, eventsApi, otherUserBookingsApi }) => {
    const event = await createEvent({ totalSeats: 5 });

    const response = await otherUserBookingsApi.createRaw({ ...aBookingRequest(event.id) });

    expect(response.status()).toBe(404);
    expect(await eventsApi.availableSeats(event.id), 'no seat was taken').toBe(5);
  });
});
