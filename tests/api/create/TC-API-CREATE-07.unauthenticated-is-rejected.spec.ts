import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

test('TC-API-CREATE-07: POST /bookings without a token returns 401 and books nothing', async ({
  createEvent,
  eventsApi,
  anonymousApi,
}) => {
  const event = await createEvent({ totalSeats: 5 });

  const response = await anonymousApi.post('bookings', { data: aBookingRequest(event.id) });

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' });
  expect(await eventsApi.availableSeats(event.id)).toBe(5);
});
