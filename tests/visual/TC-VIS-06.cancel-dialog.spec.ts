import { test, expect } from '../../src/fixtures';
import { visualCustomer, visualEvent } from '../../src/data/visual';

test('TC-VIS-06: the cancel confirmation pop-up matches the baseline', async ({ createEvent, bookingsApi, myBookingsPage, page }) => {
  const event = await createEvent(visualEvent('TC-VIS-06'));
  const booking = await bookingsApi.create({
    eventId: event.id,
    customerName: visualCustomer.name,
    customerEmail: visualCustomer.email,
    customerPhone: visualCustomer.phone,
    quantity: 2,
  });

  await myBookingsPage.open();
  await myBookingsPage.startCancel(booking.bookingRef);
  const dialog = myBookingsPage.cancelDialog.root;
  await expect(myBookingsPage.cancelDialog.title).toBeVisible();
  await page.mouse.move(0, 0);

  // The message contains the booking reference, which changes every run, so it is masked here.
  await expect(dialog).toHaveScreenshot('TC-VIS-06-cancel-dialog.png', {
    mask: [dialog.getByText(/This will cancel/)],
  });
});
