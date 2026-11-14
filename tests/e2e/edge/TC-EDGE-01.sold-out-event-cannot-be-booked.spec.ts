import { test, expect } from '../../../src/fixtures';
import { aBookingRequest, aCustomer } from '../../../src/data/booking.factory';

test('TC-EDGE-01: a sold-out event cannot be booked — every booking control is unavailable', async ({
  createEvent,
  bookingsApi,
  eventsPage,
  eventDetailPage,
}) => {
  const event = await createEvent({ totalSeats: 2 });
  await bookingsApi.create(aBookingRequest(event.id, { quantity: 2 }));

  await test.step('events list: the card is marked sold out', async () => {
    await eventsPage.open();
    await expect(eventsPage.card(event.title)).toContainText('SOLD OUT');
    await expect(eventsPage.cardAction(event.title)).toHaveText('Sold Out');
  });

  await test.step('event page: availability, counter and submit button are all blocked', async () => {
    await eventDetailPage.open(event.id);
    await expect(eventDetailPage.info('Available')).toHaveText('SOLD OUT');
    await expect(eventDetailPage.maxHint).toHaveText('(max 0)');
    await expect(eventDetailPage.increaseTickets).toBeDisabled();
    await expect(eventDetailPage.decreaseTickets).toBeDisabled();
    await expect(eventDetailPage.submitButton).toHaveText('Sold Out');
    await expect(eventDetailPage.submitButton).toBeDisabled();
  });

  await test.step('filling the form does not unlock the button, and nothing is sent', async () => {
    const requests = eventDetailPage.recordBookingRequests();
    await eventDetailPage.fillCustomer(aCustomer());
    await expect(eventDetailPage.submitButton).toBeDisabled();
    expect(requests).toHaveLength(0);
  });
});
