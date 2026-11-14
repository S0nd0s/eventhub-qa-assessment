import { test, expect } from '../../src/fixtures';
import { expectOrderSummary } from '../../src/assertions/booking.assertions';
import { visualEvent } from '../../src/data/visual';

test('TC-VIS-01: event page with the empty booking form matches the baseline', async ({ createEvent, eventDetailPage }) => {
  const event = await createEvent(visualEvent('TC-VIS-01'));

  await eventDetailPage.open(event.id);
  await expect(eventDetailPage.submitButton).toBeVisible();
  // The price block must be there before the picture is compared.
  await expectOrderSummary(eventDetailPage, event, 1);

  await expect(eventDetailPage.main).toHaveScreenshot('TC-VIS-01-booking-form.png');
});
