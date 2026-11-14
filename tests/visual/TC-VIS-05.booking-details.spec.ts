import { test, expect } from '../../src/fixtures';
import { visualCustomer, visualEvent } from '../../src/data/visual';

test('TC-VIS-05: booking details page with the refund result matches the baseline', async ({
  createEvent,
  bookingsApi,
  bookingDetailPage,
  page,
}) => {
  const event = await createEvent(visualEvent('TC-VIS-05'));
  const booking = await bookingsApi.create({
    eventId: event.id,
    customerName: visualCustomer.name,
    customerEmail: visualCustomer.email,
    customerPhone: visualCustomer.phone,
    quantity: 1,
  });

  await bookingDetailPage.open(booking.id);
  await bookingDetailPage.checkRefundButton.click();
  await expect(bookingDetailPage.refundResult).toBeVisible();
  await page.mouse.move(0, 0);

  await expect(bookingDetailPage.main).toHaveScreenshot('TC-VIS-05-booking-details.png', {
    mask: [
      bookingDetailPage.main.getByText(booking.bookingRef),
      bookingDetailPage.value('Booked on'),
      bookingDetailPage.value('Booking ID'),
    ],
  });
});
