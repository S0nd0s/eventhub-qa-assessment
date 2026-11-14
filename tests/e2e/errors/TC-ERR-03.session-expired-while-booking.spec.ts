import { test, expect } from '../../../src/fixtures';
import { aCustomer } from '../../../src/data/booking.factory';
import { API_ROUTES, simulateFailure } from '../../../src/flows/booking.flow';

test('TC-ERR-03: if the session expires while booking, the user is sent to the login page and nothing is booked', async ({
  createEvent,
  eventsApi,
  eventDetailPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 10 });
  await eventDetailPage.open(event.id);
  await eventDetailPage.fillCustomer(aCustomer());

  await simulateFailure(page, API_ROUTES.createBooking, 'POST', { status: 401, error: 'Unauthorized' });
  await eventDetailPage.submitButton.click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('#login-btn')).toBeVisible();
  expect(await eventsApi.availableSeats(event.id)).toBe(10);
});
