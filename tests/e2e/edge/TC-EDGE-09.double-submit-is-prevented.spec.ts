import { test, expect } from '../../../src/fixtures';
import { aCustomer } from '../../../src/data/booking.factory';
import { API_ROUTES } from '../../../src/flows/booking.flow';

test('TC-EDGE-09: on a slow connection the button is locked while booking, so only one booking is made', async ({
  createEvent,
  bookingsApi,
  eventsApi,
  eventDetailPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 10 });
  await eventDetailPage.open(event.id);
  await eventDetailPage.fillCustomer(aCustomer());

  // Hold the request back for 3 seconds, then let it reach the real server.
  await page.route(API_ROUTES.createBooking, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.fallback();
  });

  await eventDetailPage.submitButton.click();

  await test.step('while the request is pending the button cannot be clicked again', async () => {
    await expect(eventDetailPage.submitButton).toBeDisabled();
  });

  await test.step('exactly one booking exists afterwards', async () => {
    await expect(eventDetailPage.confirmationHeading).toBeVisible();
    const list = await bookingsApi.listRaw({ eventId: event.id });
    expect((await list.json()).pagination.total).toBe(1);
    expect(await eventsApi.availableSeats(event.id)).toBe(9);
  });
});
