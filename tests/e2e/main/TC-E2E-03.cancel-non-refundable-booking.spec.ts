import { test, expect } from '../../../src/fixtures';
import { expectCancelDialog } from '../../../src/assertions/booking.assertions';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { REFUND_MESSAGES } from '../../../src/pages/booking-detail.page';
import { expectToast } from '../../../src/pages/components';

/*
  Non-refundable booking (3 tickets), cancelled from its card in MY BOOKINGS.
  Together with TC-E2E-02 (refundable, cancelled from the details page) this covers both
  refund outcomes and both places a booking can be cancelled from.
 */
test('TC-E2E-03: a group booking (2+ tickets) is non-refundable but can still be cancelled from My Bookings', async ({
  createEvent,
  bookingsApi,
  eventsApi,
  bookingDetailPage,
  myBookingsPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 20 });
  const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 3 }));
  const card = myBookingsPage.card(booking.bookingRef);
  const dialog = myBookingsPage.cancelDialog;

  await test.step('refund check reports the booking as not eligible, with the ticket count', async () => {
    await bookingDetailPage.open(booking.id);
    await bookingDetailPage.checkRefundButton.click();
    await expect(bookingDetailPage.refundResult).toHaveText(REFUND_MESSAGES.notEligible(3));
  });

  await test.step('cancel pop-up in My Bookings names the booking and the 3 seats it releases', async () => {
    await bookingDetailPage.backLink.click();
    await myBookingsPage.startCancel(booking.bookingRef);
    await expectCancelDialog(dialog, booking, 'fromMyBookings');
  });

  await test.step('choosing "Cancel" in the pop-up keeps the booking', async () => {
    await dialog.keepButton.click();
    await expect(dialog.root).toBeHidden();
    await expect(card).toBeVisible();
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(200);
    expect(await eventsApi.availableSeats(event.id)).toBe(17);
  });

  await test.step('confirming removes the booking and shows a success message', async () => {
    await expectToast(page, 'Booking cancelled successfully', () => myBookingsPage.cancel(booking.bookingRef));
    await expect(dialog.root).toBeHidden();
    await expect(card).toHaveCount(0);
  });

  await test.step('the booking is gone on the backend and all 3 seats are released', async () => {
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(404);
    expect(await eventsApi.availableSeats(event.id)).toBe(20);
  });
});
