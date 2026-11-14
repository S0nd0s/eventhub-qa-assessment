import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { BookingDto } from '../../../src/api/types';

test('TC-API-LIST-05: GET /bookings?status=confirmed returns the active bookings', async ({ createEvent, bookingsApi }) => {
  const event = await createEvent();
  const first = await bookingsApi.create(aBookingRequest(event.id));
  const second = await bookingsApi.create(aBookingRequest(event.id, { quantity: 3 }));

  const response = await bookingsApi.listRaw({ eventId: event.id, status: 'confirmed' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.map((b: BookingDto) => b.id).sort()).toEqual([first.id, second.id].sort());
  expect(body.data.every((b: BookingDto) => b.status === 'confirmed')).toBe(true);
  expect(body.pagination.total).toBe(2);
});
