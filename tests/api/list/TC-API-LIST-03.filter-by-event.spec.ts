import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { BookingDto } from '../../../src/api/types';

test('TC-API-LIST-03: GET /bookings?eventId= returns only the bookings of that event', async ({ createEvent, bookingsApi }) => {
  const eventA = await createEvent();
  const eventB = await createEvent();
  const a1 = await bookingsApi.create(aBookingRequest(eventA.id));
  const a2 = await bookingsApi.create(aBookingRequest(eventA.id, { quantity: 2 }));
  const b1 = await bookingsApi.create(aBookingRequest(eventB.id));

  const response = await bookingsApi.listRaw({ eventId: eventA.id });

  expect(response.status()).toBe(200);
  const body = await response.json();
  const ids = body.data.map((b: BookingDto) => b.id);
  expect(ids.sort()).toEqual([a1.id, a2.id].sort());
  expect(ids).not.toContain(b1.id);
  expect(body.data.every((b: BookingDto) => b.eventId === eventA.id)).toBe(true);
  expect(body.pagination.total).toBe(2);

  await test.step('an event without bookings gives an empty list', async () => {
    const empty = await createEvent();
    const emptyBody = await (await bookingsApi.listRaw({ eventId: empty.id })).json();
    expect(emptyBody.data).toEqual([]);
    expect(emptyBody.pagination.total).toBe(0);
  });
});
