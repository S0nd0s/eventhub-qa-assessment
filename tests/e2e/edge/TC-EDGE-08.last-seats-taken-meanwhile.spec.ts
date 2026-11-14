import { test, expect } from '../../../src/fixtures';
import { aBookingRequest, aCustomer } from '../../../src/data/booking.factory';
import { expectToast } from '../../../src/pages/components';

test('TC-EDGE-08: if the last seat is taken while the form is open, the booking is refused with a clear message', async ({
  createEvent,
  bookingsApi,
  eventDetailPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 1 });
  await eventDetailPage.open(event.id);
  await eventDetailPage.fillCustomer(aCustomer());

  // Someone else takes the last seat.
  await bookingsApi.create(aBookingRequest(event.id, { quantity: 1 }));

  await expectToast(page, 'Only 0 seat(s) available, but 1 requested', () => eventDetailPage.submitButton.click());

  await expect(eventDetailPage.confirmationHeading).toBeHidden();

  await test.step('after a reload the page shows the event as sold out', async () => {
    await page.reload();
    await expect(eventDetailPage.submitButton).toHaveText('Sold Out');
    await expect(eventDetailPage.submitButton).toBeDisabled();
  });
});
