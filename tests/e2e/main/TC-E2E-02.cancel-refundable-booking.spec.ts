import { test, expect } from '../../../src/fixtures';
import { expectCancelDialog } from '../../../src/assertions/booking.assertions';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { REFUND_MESSAGES } from '../../../src/pages/booking-detail.page';
import { expectToast } from '../../../src/pages/components';

/*
 Refundable booking (1 ticket), cancelled from its DETAILS PAGE.
 Together with TC-E2E-03 (non-refundable, cancelled from My Bookings) this covers both
 refund outcomes and both places a booking can be cancelled from.
 */
test('TC-E2E-02: a single-ticket booking is refundable and can be cancelled from its details page', async ({
  createEvent,
  bookingsApi,
  eventsApi,
  bookingDetailPage,
  myBookingsPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 20 });
  const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 1 }));
  const dialog = bookingDetailPage.cancelDialog;

  await bookingDetailPage.open(booking.id);

  await test.step('refund check reports the booking as eligible', async () => {
    await expect(bookingDetailPage.refundResult).toBeHidden();
    await bookingDetailPage.checkRefundButton.click();
       await expect(bookingDetailPage.refundResult).toHaveText(REFUND_MESSAGES.eligible);
  });

  await test.step('cancel pop-up names the booking and the 1 seat it releases', async () => {
    await bookingDetailPage.cancelButton.click();
    await expectCancelDialog(dialog, booking, 'fromDetails');
  });

  await test.step('closing the pop-up with "×" keeps the booking and stays on the page', async () => {
    await dialog.closeButton.click();
    await expect(dialog.root).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/bookings/${booking.id}$`));
    await expect(bookingDetailPage.cancelButton).toBeVisible();
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(200);
    expect(await eventsApi.availableSeats(event.id)).toBe(19);
  });

  await test.step('confirming returns to My Bookings with a success message, without the booking', async () => {
    await expectToast(page, 'Booking cancelled successfully', () => bookingDetailPage.cancel());
    await expect(dialog.root).toBeHidden();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(myBookingsPage.card(booking.bookingRef)).toHaveCount(0);
  });

  await test.step('the booking is gone on the backend and the seat is released', async () => {
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(404);
    expect(await eventsApi.availableSeats(event.id)).toBe(20);
  });
});
