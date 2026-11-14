import { test, expect } from '../../../src/fixtures';
import { expectConfirmation } from '../../../src/assertions/booking.assertions';
import { aCustomer } from '../../../src/data/booking.factory';
import { API_ROUTES, SERVER_ERROR, simulateFailure } from '../../../src/flows/booking.flow';
import { expectToast } from '../../../src/pages/components';

test('TC-ERR-01: when the server fails while booking, the user is told', async ({
  createEvent,
  eventsApi,
  eventDetailPage,
  page,
}) => {
  const event = await createEvent({ totalSeats: 10 });
  const customer = aCustomer();
  await eventDetailPage.open(event.id);
  await eventDetailPage.fillCustomer(customer);

  const restore = await simulateFailure(page, API_ROUTES.createBooking, 'POST', SERVER_ERROR);

  await test.step('an error message is shown and no confirmation appears', async () => {
    await expectToast(page, 'Internal server error', () => eventDetailPage.submitButton.click());
    await expect(eventDetailPage.confirmationHeading).toBeHidden();
  });

});
