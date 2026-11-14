import { test, expect } from '../../../src/fixtures';
import { expectConfirmation, expectOrderSummary } from '../../../src/assertions/booking.assertions';
import { aCustomer } from '../../../src/data/booking.factory';

test('TC-EDGE-05: with fewer than 10 seats left, the counter is capped at the remaining seats', async ({
  createEvent,
  eventsApi,
  eventsPage,
  eventDetailPage,
}) => {
  const event = await createEvent({ price: 100, totalSeats: 3 });

  await test.step('events list warns that few seats are left', async () => {
    await eventsPage.open();
    await expect(eventsPage.card(event.title)).toContainText('3 seats left!');
    await expect(eventsPage.cardAction(event.title)).toHaveText('Book Now');
  });

  await test.step('the counter cannot go past the 3 remaining seats', async () => {
    await eventDetailPage.open(event.id);
    await expect(eventDetailPage.maxHint).toHaveText('(max 3)');
    await eventDetailPage.selectTickets(3);
    await expect(eventDetailPage.increaseTickets).toBeDisabled();
    await expectOrderSummary(eventDetailPage, event, 3);
  });

  await test.step('booking all remaining seats works', async () => {
    await eventDetailPage.fillCustomer(aCustomer());
    const booking = await eventDetailPage.confirm();
    await expectConfirmation(eventDetailPage, booking, event);
    expect(booking.quantity).toBe(3);
    expect(await eventsApi.availableSeats(event.id)).toBe(0);
  });
});
