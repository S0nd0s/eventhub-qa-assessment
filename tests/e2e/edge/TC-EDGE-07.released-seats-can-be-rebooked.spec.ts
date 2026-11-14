import { test, expect } from '../../../src/fixtures';
import { expectConfirmation, expectOrderSummary } from '../../../src/assertions/booking.assertions';
import { aBookingRequest } from '../../../src/data/booking.factory';

/**
 Precondition "event is fully booked" is built through the API
 the released seats are re-booked by the same user.
 */
test('TC-EDGE-07: when N seats of a sold-out event are released, at most N seats can be booked again', async ({
  createEvent,
  bookingsApi,
  eventsApi,
  eventDetailPage,
}) => {
  const released = 3;
  const event = await createEvent({ price: 100, totalSeats: 8 });
  await bookingsApi.create(aBookingRequest(event.id, { quantity: 5 }));
  const toRelease = await bookingsApi.create(aBookingRequest(event.id, { quantity: released }));

  await test.step('event is sold out before the release', async () => {
    await eventDetailPage.open(event.id);
    await expect(eventDetailPage.submitButton).toHaveText('Sold Out');
  });

  await test.step(`release ${released} seats by cancelling a booking`, async () => {
    await bookingsApi.cancel(toRelease.id);
    expect(await eventsApi.availableSeats(event.id)).toBe(released);
  });

  await test.step(`the page offers exactly ${released} seats and the counter stops there`, async () => {
    await eventDetailPage.open(event.id);
    await expect(eventDetailPage.info('Available')).toHaveText(`${released} / 8 seats`);
    await expect(eventDetailPage.maxHint).toHaveText(`(max ${released})`);
    await eventDetailPage.selectTickets(released);
    await expect(eventDetailPage.ticketCount).toHaveText(String(released));
    await expect(eventDetailPage.increaseTickets).toBeDisabled();
  });

  await test.step('asking the backend for more than the released seats is rejected', async () => {
    const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id, { quantity: released + 1 }) });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe(`Only ${released} seat(s) available, but ${released + 1} requested`);
  });

  await test.step(`booking the ${released} released seats works and sells the event out again`, async () => {
    await eventDetailPage.fillCustomer({ name: 'QA Rebooker', email: 'qa.rebooker@example.com', phone: '+91-9876543210' });
    await expectOrderSummary(eventDetailPage, event, released);
    const booking = await eventDetailPage.confirm();
    await expectConfirmation(eventDetailPage, booking, event);
    expect(booking.quantity).toBe(released);
    expect(await eventsApi.availableSeats(event.id)).toBe(0);
  });
});
