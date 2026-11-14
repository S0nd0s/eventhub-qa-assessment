import { test, expect } from '../../src/fixtures';
import { visualCustomer, visualEvent } from '../../src/data/visual';

test('TC-VIS-07: a sold-out event page matches the baseline', async ({ createEvent, bookingsApi, eventDetailPage }) => {
  const event = await createEvent(visualEvent('TC-VIS-07', 2));
  await bookingsApi.create({
    eventId: event.id,
    customerName: visualCustomer.name,
    customerEmail: visualCustomer.email,
    customerPhone: visualCustomer.phone,
    quantity: 2,
  });

  await eventDetailPage.open(event.id);
  await expect(eventDetailPage.submitButton).toHaveText('Sold Out');

  await expect(eventDetailPage.main).toHaveScreenshot('TC-VIS-07-sold-out.png');
});
