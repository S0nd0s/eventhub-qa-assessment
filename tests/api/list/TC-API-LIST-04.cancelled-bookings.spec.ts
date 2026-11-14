import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

/*
 The API documents a "cancelled" status and a status=cancelled filter, but cancelling
 deletes the booking, so the filter can never return anything. 
the mismatch with the documentation is reported in the README.
 */
test('TC-API-LIST-04: a cancelled booking is removed from every list, including status=cancelled', async ({
  createEvent,
  bookingsApi,
}) => {
  const event = await createEvent();
  const kept = await bookingsApi.create(aBookingRequest(event.id));
  const cancelled = await bookingsApi.create(aBookingRequest(event.id));
  await bookingsApi.cancel(cancelled.id);

  const all = await (await bookingsApi.listRaw({ eventId: event.id })).json();
  expect(all.data.map((b: { id: number }) => b.id)).toEqual([kept.id]);

  const onlyCancelled = await bookingsApi.listRaw({ eventId: event.id, status: 'cancelled' });
  expect(onlyCancelled.status()).toBe(200);
  const body = await onlyCancelled.json();
  expect(body.data).toEqual([]);
  expect(body.pagination.total).toBe(0);
});
