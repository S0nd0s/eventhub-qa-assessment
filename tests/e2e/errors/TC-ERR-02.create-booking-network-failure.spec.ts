import { test, expect } from '../../../src/fixtures';
import { aCustomer } from '../../../src/data/booking.factory';
import { API_ROUTES, simulateFailure } from '../../../src/flows/booking.flow';
import { expectToast } from '../../../src/pages/components';

test('TC-ERR-02: when the network drops while booking, the user sees "Network Error" and nothing is booked', async ({
  createEvent,
  eventsApi,
  bookingsApi,
  eventDetailPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 10 });
  await eventDetailPage.open(event.id);
  await eventDetailPage.fillCustomer(aCustomer());

  await simulateFailure(page, API_ROUTES.createBooking, 'POST', 'network');
  await expectToast(page, 'Network Error', () => eventDetailPage.submitButton.click());

  await expect(eventDetailPage.confirmationHeading).toBeHidden();
  await expect(eventDetailPage.submitButton).toBeEnabled();

  expect(await eventsApi.availableSeats(event.id)).toBe(10);
  const list = await bookingsApi.listRaw({ eventId: event.id });
  expect((await list.json()).pagination.total).toBe(0);
});
