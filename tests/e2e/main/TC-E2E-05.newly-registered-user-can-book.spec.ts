import { test, expect } from '../../../src/fixtures';
import { expectBookingCard, expectConfirmation, expectOrderSummary } from '../../../src/assertions/booking.assertions';
import { aCustomer, formatPrice } from '../../../src/data/booking.factory';
import { EventDetailPage } from '../../../src/pages/event-detail.page';
import { MyBookingsPage } from '../../../src/pages/my-bookings.page';

/*
  A brand-new account is registered through the API for this test.
  The API offers no way to delete an account, so the account stays behind (with no data in it).
 */
test('TC-E2E-05: a newly registered user starts with no bookings and can book', async ({ newUser, browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: newUser.storageState });
  const page = await context.newPage();
  const eventDetailPage = new EventDetailPage(page);
  const myBookingsPage = new MyBookingsPage(page);

  await test.step('the new user is logged in and has an empty My Bookings page', async () => {
    await myBookingsPage.open();
    await expect(myBookingsPage.emptyState).toBeVisible();
    await expect(page.getByText("You haven't booked any events yet.")).toBeVisible();
    await expect(myBookingsPage.browseEventsLink).toBeVisible();
    await expect(myBookingsPage.cards).toHaveCount(0);
  });

  const event = await newUser.createEvent({ price: 250, totalSeats: 10 });
  const customer = aCustomer();

  const booking = await test.step('the new user books 2 tickets', async () => {
    await eventDetailPage.open(event.id);
    await eventDetailPage.selectTickets(2);
    await eventDetailPage.fillCustomer(customer);
    await expectOrderSummary(eventDetailPage, event, 2);
    const created = await eventDetailPage.confirm();
    await expectConfirmation(eventDetailPage, created, event);
    return created;
  });

  await test.step('the booking is the only one in My Bookings', async () => {
    await myBookingsPage.open();
    await expect(myBookingsPage.cards).toHaveCount(1);
    await expectBookingCard(myBookingsPage, booking, event);
    await expect(myBookingsPage.emptyState).toBeHidden();
  });

  await context.close();
});
