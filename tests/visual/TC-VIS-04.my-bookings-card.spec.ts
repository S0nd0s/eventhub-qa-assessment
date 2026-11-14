import { test, expect } from '../../src/fixtures';
import { expectBookingCard } from '../../src/assertions/booking.assertions';
import { visualCustomer, visualEvent } from '../../src/data/visual';

test('TC-VIS-04: a booking card in My Bookings matches the baseline', async ({ createEvent, bookingsApi, myBookingsPage }) => {
  const event = await createEvent(visualEvent('TC-VIS-04'));
  const booking = await bookingsApi.create({
    eventId: event.id,
    customerName: visualCustomer.name,
    customerEmail: visualCustomer.email,
    customerPhone: visualCustomer.phone,
    quantity: 2,
  });

  await myBookingsPage.open();
  const card = myBookingsPage.card(booking.bookingRef);
  await expect(card).toBeVisible();
  await expectBookingCard(myBookingsPage, booking, event);
  await expect(card).toHaveScreenshot('TC-VIS-04-booking-card.png', {
    mask: [card.getByText(booking.bookingRef), card.getByTestId('booking-id'), card.getByText(/Booked/)],
  });
});
