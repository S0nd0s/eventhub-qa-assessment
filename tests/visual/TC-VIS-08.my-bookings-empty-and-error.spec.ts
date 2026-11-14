import { test, expect } from '../../src/fixtures';
import { API_ROUTES, SERVER_ERROR, simulateFailure } from '../../src/flows/booking.flow';


test.describe('TC-VIS-08: My Bookings empty and error states match the baseline', () => {
  test('empty state', async ({ myBookingsPage, page }) => {
    await page.route(API_ROUTES.listBookings, (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ json: { success: true, data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } })
        : route.fallback(),
    );

    await myBookingsPage.open();
    await expect(myBookingsPage.emptyState).toBeVisible();

    await expect(page.locator('main')).toHaveScreenshot('TC-VIS-08-my-bookings-empty.png');
  });

  test('load error state', async ({ myBookingsPage, page }) => {
    await simulateFailure(page, API_ROUTES.listBookings, 'GET', SERVER_ERROR);

    await myBookingsPage.open();
    await expect(myBookingsPage.loadError).toBeVisible();

    await expect(page.locator('main')).toHaveScreenshot('TC-VIS-08-my-bookings-error.png');
  });
});
