import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { API_ROUTES, SERVER_ERROR, simulateFailure } from '../../../src/flows/booking.flow';

for (const [name, failure] of [['server error', SERVER_ERROR], ['network failure', 'network']] as const) {
  test(`TC-ERR-05: My Bookings shows an error with Retry on ${name}, and Retry recovers`, async ({
    createEvent,
    bookingsApi,
    myBookingsPage,
    page,
  }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));
    const restore = await simulateFailure(page, API_ROUTES.listBookings, 'GET', failure);

    await myBookingsPage.open();

    await expect(myBookingsPage.loadError).toBeVisible();
    await expect(page.getByText('Failed to connect to the server. Please try again.')).toBeVisible();
    await expect(myBookingsPage.retryButton).toBeVisible();
    await expect(myBookingsPage.cards).toHaveCount(0);
    // The error must not be mistaken for "you have no bookings".
    await expect(myBookingsPage.emptyState).toBeHidden();

    await restore();
    await myBookingsPage.retryButton.click();

    await expect(myBookingsPage.loadError).toBeHidden();
    await expect(myBookingsPage.card(booking.bookingRef)).toBeVisible();
  });
}
