import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { BookingDto } from '../../../src/api/types';

test.describe('TC-API-LIST-06: GET /bookings returns all of the user’s bookings with their event', () => {
  test('bookings across events are listed, newest first, each with full event details', async ({ createEvent, bookingsApi }) => {
    const eventA = await createEvent({ price: 100 });
    const eventB = await createEvent({ price: 250 });
    const older = await bookingsApi.create(aBookingRequest(eventA.id, { quantity: 2 }));
    const newer = await bookingsApi.create(aBookingRequest(eventB.id, { quantity: 1 }));

   
    const response = await bookingsApi.listRaw({ limit: 100 });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const mine: BookingDto[] = body.data.filter((b: BookingDto) => [older.id, newer.id].includes(b.id));
    expect(mine.map((b) => b.id), 'newest booking comes first').toEqual([newer.id, older.id]);

    const listedOlder = mine[1];
    expect(listedOlder).toMatchObject({
      id: older.id,
      eventId: eventA.id,
      quantity: 2,
      totalPrice: '200',
      status: 'confirmed',
      bookingRef: older.bookingRef,
    });
    expect(listedOlder.event).toMatchObject({ id: eventA.id, title: eventA.title, city: eventA.city, price: '100' });
  });

  test("another user's bookings are never included", async ({ createEvent, bookingsApi, otherUserBookingsApi }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    const response = await otherUserBookingsApi.listRaw({ limit: 100 });

    expect(response.status()).toBe(200);
    const ids = (await response.json()).data.map((b: BookingDto) => b.id);
    expect(ids).not.toContain(booking.id);
  });
});
