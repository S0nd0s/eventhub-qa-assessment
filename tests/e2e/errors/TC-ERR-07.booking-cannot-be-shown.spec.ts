import { Page } from '@playwright/test';
import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';
import { authFiles } from '../../../src/config/env';
import { BookingDetailPage } from '../../../src/pages/booking-detail.page';
import { MyBookingsPage } from '../../../src/pages/my-bookings.page';

// Every "booking cannot be shown" page offers a "View My Bookings" button as the way out.
 
async function expectViewMyBookingsWayOut(page: Page, bookingRef?: string) {
  const detail = new BookingDetailPage(page);
  const list = new MyBookingsPage(page);

  await expect(detail.viewMyBookingsLink).toBeVisible();
  await expect(detail.viewMyBookingsLink).toHaveText('View My Bookings');
  await expect(detail.viewMyBookingsLink).toHaveAttribute('href', '/bookings');

  await detail.viewMyBookingsLink.click();

  await expect(page).toHaveURL(/\/bookings$/);
  await expect(list.heading).toBeVisible();
  await expect(detail.notFoundHeading).toBeHidden();
  if (bookingRef) await expect(list.card(bookingRef)).toHaveCount(0);
}

test.describe('TC-ERR-07: a booking that cannot be shown gives a clear page with a way out', () => {
  test('booking id does not exist', async ({ bookingDetailPage, page }) => {
    await bookingDetailPage.open('99999999');

    await expect(bookingDetailPage.notFoundHeading).toBeVisible();
    await expect(page.getByText("This booking doesn't exist or may have been cancelled.")).toBeVisible();
    await expect(bookingDetailPage.cancelButton).toHaveCount(0);

    await expectViewMyBookingsWayOut(page);
  });

  test('booking was cancelled: its details page is no longer available', async ({ createEvent, bookingsApi, bookingDetailPage, page }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));
    await bookingsApi.cancel(booking.id);

    await bookingDetailPage.open(booking.id);

    await expect(bookingDetailPage.notFoundHeading).toBeVisible();
    await expect(bookingDetailPage.cancelButton).toHaveCount(0);

    await expectViewMyBookingsWayOut(page, booking.bookingRef);
  });

  test("another user's booking shows Access Denied, with no booking data", async ({ createEvent, bookingsApi, browser, baseURL }) => {
    const event = await createEvent();
    const booking = await bookingsApi.create(aBookingRequest(event.id));

    // Open the booking in a browser logged in as the other permanent user.
    const context = await browser.newContext({ baseURL, storageState: authFiles.storageState('secondary') });
    const page = await context.newPage();
    try {
      await page.goto(`/bookings/${booking.id}`);
      await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
      await expect(page.getByText('You are not authorized to view this booking.')).toBeVisible();
      await expect(page.locator('main')).not.toContainText(booking.bookingRef);
      await expect(page.locator('main')).not.toContainText(booking.customerEmail);

      // The way out leads to the OTHER user's own list, which does not contain this booking.
      await expectViewMyBookingsWayOut(page, booking.bookingRef);
    } finally {
      await context.close();
    }
  });
});
