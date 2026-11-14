import { test, expect } from '../../../src/fixtures';
import { expectBookingCard, expectBookingDetails, expectConfirmation, expectOrderSummary } from '../../../src/assertions/booking.assertions';
import { aCustomer } from '../../../src/data/booking.factory';

test('TC-E2E-01: user books the minimum number of tickets (1) and sees it everywhere', async ({
  createEvent,
  eventsApi,
  eventDetailPage,
  myBookingsPage,
  bookingDetailPage,
  page,
}) => {
  const event = await createEvent({ price: 250, totalSeats: 50 });
  const customer = aCustomer();

  await test.step('event page shows the booking form', async () => {
    await eventDetailPage.open(event.id);
    await expect(eventDetailPage.bookingHeading).toBeVisible();
    await expect(eventDetailPage.maxHint).toHaveText('(max 10)');
    await expect(eventDetailPage.nameInput).toHaveAttribute('placeholder', 'Your full name');
    await expect(eventDetailPage.emailInput).toHaveAttribute('placeholder', 'you@email.com');
    await expect(eventDetailPage.phoneInput).toHaveAttribute('placeholder', '+91 98765 43210');
    await expect(eventDetailPage.submitButton).toHaveText('Confirm Booking');
    await expect(eventDetailPage.submitButton).toBeEnabled();
  });

  await test.step('order summary shows price x 1 ticket', async () => {
    await expectOrderSummary(eventDetailPage, event, 1);
  });

  const booking = await test.step('confirm the booking', async () => {
    await eventDetailPage.fillCustomer(customer);
    return eventDetailPage.confirm();
  });

  await test.step('confirmation panel shows reference, customer, tickets, total and next actions', async () => {
    await expectConfirmation(eventDetailPage, booking, event);
    await expect(eventDetailPage.submitButton).toBeHidden();
  });

  await test.step('the backend stored the booking and took one seat', async () => {
    expect(booking).toMatchObject({ eventId: event.id, quantity: 1, status: 'confirmed', customerName: customer.name });
    expect(await eventsApi.availableSeats(event.id)).toBe(49);
  });

  await test.step('"View My Bookings" leads to the list, where the booking card is complete', async () => {
    await eventDetailPage.viewMyBookingsLink.click();
    await expect(myBookingsPage.heading).toBeVisible();
    await expectBookingCard(myBookingsPage, booking, event);
  });

  await test.step('"View Details" shows the full booking', async () => {
    await myBookingsPage.viewDetails(booking.bookingRef);
    await expectBookingDetails(bookingDetailPage, booking, event);
  });

  await test.step('"← Back to My Bookings" returns to the list, with the booking still there', async () => {
    await bookingDetailPage.backLink.click();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(myBookingsPage.heading).toBeVisible();
    await expect(myBookingsPage.card(booking.bookingRef)).toBeVisible();
  });
});
