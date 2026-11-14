import { test, expect } from '../../src/fixtures';
import { expectConfirmation, expectOrderSummary } from '../../src/assertions/booking.assertions';
import { visualCustomer, visualEvent } from '../../src/data/visual';

test('TC-VIS-03: booking confirmation matches the baseline', async ({ createEvent, eventDetailPage, page }) => {
  const event = await createEvent(visualEvent('TC-VIS-03'));

  await eventDetailPage.open(event.id);
  await eventDetailPage.selectTickets(2);
  await eventDetailPage.fillCustomer(visualCustomer);
  await expectOrderSummary(eventDetailPage, event, 2);
  const booking = await eventDetailPage.confirm();
  await expectConfirmation(eventDetailPage, booking, event);
  await page.mouse.move(0, 0);

  await expect(eventDetailPage.main).toHaveScreenshot('TC-VIS-03-confirmation.png', {
    mask: [eventDetailPage.confirmationValue('Booking Ref')],
  });
});
