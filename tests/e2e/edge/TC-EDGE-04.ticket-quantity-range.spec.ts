import { test, expect } from '../../../src/fixtures';
import { expectOrderSummary } from '../../../src/assertions/booking.assertions';
import { TICKET_LIMITS } from '../../../src/data/booking.factory';

test('TC-EDGE-04: the ticket counter stays between 1 and 10 and the total follows it', async ({ createEvent, eventDetailPage }) => {
  const event = await createEvent({ price: 250, totalSeats: 50 });
  await eventDetailPage.open(event.id);

  await test.step('starts at the minimum: 1 ticket, "−" disabled, "+" enabled', async () => {
    await expectOrderSummary(eventDetailPage, event, 1);
    await expect(eventDetailPage.decreaseTickets).toBeDisabled();
    await expect(eventDetailPage.increaseTickets).toBeEnabled();
    await expect(eventDetailPage.maxHint).toHaveText(`(max ${TICKET_LIMITS.max})`);
  });

  await test.step('each "+" adds one ticket and updates the summary and total', async () => {
    for (let quantity = 2; quantity <= TICKET_LIMITS.max; quantity++) {
      await eventDetailPage.increaseTickets.click();
      await expectOrderSummary(eventDetailPage, event, quantity);
    }
  });

  await test.step('stops at the maximum: 10 tickets, "+" disabled, "−" enabled', async () => {
    await expect(eventDetailPage.increaseTickets).toBeDisabled();
    await expect(eventDetailPage.decreaseTickets).toBeEnabled();
  });

  await test.step('"−" goes back down and stops at 1', async () => {
    for (let quantity = TICKET_LIMITS.max - 1; quantity >= TICKET_LIMITS.min; quantity--) {
      await eventDetailPage.decreaseTickets.click();
      await expectOrderSummary(eventDetailPage, event, quantity);
    }
    await expect(eventDetailPage.decreaseTickets).toBeDisabled();
    await expectOrderSummary(eventDetailPage, event, 1);
  });
});
