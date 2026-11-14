import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { API_ROUTES, SERVER_ERROR, simulateFailure } from '../../../src/flows/booking.flow';
import { expectToast, toast } from '../../../src/pages/components';

const cases = [
  { name: 'server error', failure: SERVER_ERROR, message: 'Internal server error' },
  { name: 'network failure', failure: 'network', message: 'Network Error' },
] as const;

for (const { name, failure, message } of cases) {
  test(`TC-ERR-06: when cancelling fails with a ${name}, the user is told and the booking stays`, async ({
    createEvent,
    bookingsApi,
    eventsApi,
    myBookingsPage,
    page,
  }) => {
    const event = await createEvent({ totalSeats: 10 });
    const booking = await bookingsApi.create(aBookingRequest(event.id, { quantity: 2 }));
    await myBookingsPage.open();

    const restore = await simulateFailure(page, API_ROUTES.oneBooking, 'DELETE', failure);
    await expectToast(page, message, () => myBookingsPage.cancel(booking.bookingRef));

    await expect(toast(page)).not.toContainText('Booking cancelled successfully');
    await expect(myBookingsPage.card(booking.bookingRef)).toBeVisible();
    expect((await bookingsApi.getByIdRaw(booking.id)).status()).toBe(200);
    expect(await eventsApi.availableSeats(event.id)).toBe(8);

    await test.step('cancelling works once the failure is gone', async () => {
      await restore();
      await myBookingsPage.cancel(booking.bookingRef);
      await expect(myBookingsPage.card(booking.bookingRef)).toHaveCount(0);
    });
  });
}
