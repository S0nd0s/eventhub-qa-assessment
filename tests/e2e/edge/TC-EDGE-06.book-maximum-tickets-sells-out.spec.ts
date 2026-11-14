import { test, expect } from '../../../src/fixtures';
import { aBookingRequest, formatPrice, TICKET_LIMITS } from '../../../src/data/booking.factory';
import { bookThroughUi } from '../../../src/flows/booking.flow';

//event becomes fully booked, so ANOTHER user cannot book it".
test('TC-EDGE-06: booking the maximum (10) tickets sells the event out and blocks further bookings', async ({
  createEvent,
  eventsApi,
  bookingsApi,
  otherUserBookingsApi,
  eventDetailPage,
  eventsPage,
  page,
}) => {
  const event = await createEvent({ price: 100, totalSeats: TICKET_LIMITS.max });

  const { booking } = await test.step('book 10 tickets through the UI', async () => {
    const result = await bookThroughUi(eventDetailPage, event, TICKET_LIMITS.max);
    return result;
  });

  await test.step('no seats are left on the backend', async () => {
    expect(booking.quantity).toBe(10);
    expect(await eventsApi.availableSeats(event.id)).toBe(0);
  });

  await test.step('the event page now shows SOLD OUT and the form cannot be submitted', async () => {
    await page.reload();
    await expect(eventDetailPage.info('Available')).toHaveText('SOLD OUT');
    await expect(eventDetailPage.submitButton).toHaveText('Sold Out');
    await expect(eventDetailPage.submitButton).toBeDisabled();
  });

  await test.step('the events list marks the event as sold out', async () => {
    await eventsPage.open();
    await expect(eventsPage.card(event.title)).toContainText('SOLD OUT');
    await expect(eventsPage.cardAction(event.title)).toHaveText('Sold Out');
  });

  await test.step('a further booking attempt is rejected', async () => {
    const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id) });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('Only 0 seat(s) available, but 1 requested');
  });

  await test.step('another user cannot book it either (the event does not exist for them)', async () => {
    const response = await otherUserBookingsApi.createRaw({ ...aBookingRequest(event.id) });
    expect(response.status()).toBe(404);
  });
});
