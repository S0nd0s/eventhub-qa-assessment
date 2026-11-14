import { test, expect } from '../../../src/fixtures';
import { API_ROUTES, SERVER_ERROR, simulateFailure } from '../../../src/flows/booking.flow';

for (const [name, failure] of [['server error', SERVER_ERROR], ['network failure', 'network']] as const) {
  test(`TC-ERR-04: events list shows an error with Retry on ${name}, and Retry recovers`, async ({
    createEvent,
    eventsPage,
    page,
  }) => {
    const event = await createEvent();
    const restore = await simulateFailure(page, API_ROUTES.listEvents, 'GET', failure);

    await eventsPage.open();

    await expect(eventsPage.loadError).toBeVisible();
    await expect(page.getByText('There was a problem connecting to the server. Please try again.')).toBeVisible();
    await expect(eventsPage.retryButton).toBeVisible();
    await expect(eventsPage.cards).toHaveCount(0);

    await restore();
    await eventsPage.retryButton.click();

    await expect(eventsPage.loadError).toBeHidden();
    await expect(eventsPage.card(event.title)).toBeVisible();
  });
}
