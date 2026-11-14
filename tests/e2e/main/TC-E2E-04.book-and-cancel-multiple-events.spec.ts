import { test, expect } from '../../../src/fixtures';
import { expectBookingCard } from '../../../src/assertions/booking.assertions';
import { BookingDto } from '../../../src/api/types';
import { bookThroughUi } from '../../../src/flows/booking.flow';

test('TC-E2E-04: user books several events, sees each one correctly, and cancels them one by one', async ({
  createEvent,
  eventsApi,
  eventDetailPage,
  myBookingsPage,
}) => {
  test.slow(); // three bookings through the browser

  const plan = [
    { event: await createEvent({ price: 100, totalSeats: 20 }), quantity: 1 },
    { event: await createEvent({ price: 250, totalSeats: 20 }), quantity: 2 },
    { event: await createEvent({ price: 1500, totalSeats: 20 }), quantity: 3 },
  ];

  const refs: string[] = [];
  const bookings: BookingDto[] = [];
  for (const { event, quantity } of plan) {
    await test.step(`book ${quantity} ticket(s) for "${event.title}"`, async () => {
      const { booking } = await bookThroughUi(eventDetailPage, event, quantity);
      refs.push(booking.bookingRef);
      bookings.push(booking);
    });
  }

  await test.step('My Bookings lists every booking with its own event, tickets and total', async () => {
    await myBookingsPage.open();
    for (const [i, { event }] of plan.entries()) {
      await expectBookingCard(myBookingsPage, bookings[i], event);
    }
  });

  await test.step('cancelling one booking leaves the other two untouched', async () => {
    await myBookingsPage.cancel(refs[1]);
    await expect(myBookingsPage.card(refs[1])).toHaveCount(0);
    await expect(myBookingsPage.card(refs[0])).toBeVisible();
    await expect(myBookingsPage.card(refs[2])).toBeVisible();
    expect(await eventsApi.availableSeats(plan[1].event.id)).toBe(20);
    expect(await eventsApi.availableSeats(plan[0].event.id)).toBe(19);
    expect(await eventsApi.availableSeats(plan[2].event.id)).toBe(17);
  });

  await test.step('the remaining bookings can be cancelled too', async () => {
    for (const ref of [refs[0], refs[2]]) {
      await myBookingsPage.cancel(ref);
      await expect(myBookingsPage.card(ref)).toHaveCount(0);
    }
    expect(await eventsApi.availableSeats(plan[0].event.id)).toBe(20);
    expect(await eventsApi.availableSeats(plan[2].event.id)).toBe(20);
  });
});
