import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test.describe('TC-API-CREATE-02: POST /bookings cannot take more seats than are available', () => {
  test('a fully booked event rejects any further booking', async ({ createEvent, bookingsApi, eventsApi }) => {
    const event = await createEvent({ totalSeats: 2 });
    await bookingsApi.create(aBookingRequest(event.id, { quantity: 2 }));

    const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id, { quantity: 1 }) });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ success: false, error: 'Only 0 seat(s) available, but 1 requested' });
    expect(await eventsApi.availableSeats(event.id)).toBe(0);
  });

  test('asking for more than the remaining seats is rejected and takes none', async ({ createEvent, bookingsApi, eventsApi }) => {
    const event = await createEvent({ totalSeats: 3 });
    await bookingsApi.create(aBookingRequest(event.id, { quantity: 1 }));

    const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id, { quantity: 3 }) });

    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('Only 2 seat(s) available, but 3 requested');
    expect(await eventsApi.availableSeats(event.id), 'a rejected booking must not take seats').toBe(2);
  });

  test('two requests racing for the last seat: exactly one wins', async ({ createEvent, bookingsApi, eventsApi }) => {
    const event = await createEvent({ totalSeats: 1 });

    const responses = await Promise.all([
      bookingsApi.createRaw({ ...aBookingRequest(event.id) }),
      bookingsApi.createRaw({ ...aBookingRequest(event.id) }),
    ]);

    expect(responses.map((r) => r.status()).sort()).toEqual([201, 400]);
    expect(await eventsApi.availableSeats(event.id)).toBe(0);
  });
});
