import { expect } from '@playwright/test';
import { BookingDto, EventDto } from '../api/types';
import { formatPrice } from '../data/booking.factory';
import { EventDetailPage } from '../pages/event-detail.page';
import { MyBookingsPage } from '../pages/my-bookings.page';
import { BookingDetailPage } from '../pages/booking-detail.page';
import { CancelDialog } from '../pages/components';

/**
 * Shared checks for the screens of the booking flow.
 * Every test that shows one of these screens calls the matching check, so prices, totals and
 * booking data are verified the same way everywhere, and a change in the UI is fixed in one place.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Dates on a booking card look like "15 Jun 2027" (in the browser's local time zone). */
export function cardDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Dates on the booking details page look like "Tuesday, 15 June 2027" (browser's local time zone). */
export function detailDate(iso: string): string {
  const date = new Date(iso);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export const ticketsLabel = (quantity: number) => (quantity === 1 ? '1 ticket' : `${quantity} tickets`);

/**
 * Booking form on the event page:
 *  - price per ticket in the card header, with its "per ticket" label
 *  - the line "price × N tickets" and its amount
 *  - Total = price per ticket × N
 */
export async function expectOrderSummary(eventDetailPage: EventDetailPage, event: Pick<EventDto, 'price'>, quantity: number) {
  const unitPrice = Number(event.price);
  const total = formatPrice(unitPrice * quantity);

  await expect(eventDetailPage.pricePerTicket, 'price per ticket in the card header').toHaveText(formatPrice(unitPrice));
  await expect(eventDetailPage.perTicketLabel).toBeVisible();
  await expect(eventDetailPage.ticketCount).toHaveText(String(quantity));

  const line = `${formatPrice(unitPrice)} × ${ticketsLabel(quantity)}`;
  await expect(eventDetailPage.summaryLine(line), 'summary line "price × tickets"').toBeVisible();
  await expect(eventDetailPage.summaryLineAmount(line), 'amount of the summary line').toHaveText(total);
  await expect(eventDetailPage.orderTotal(), 'Total = price per ticket × tickets').toHaveText(total);
}

/** Confirmation panel shown after "Confirm Booking". */
export async function expectConfirmation(eventDetailPage: EventDetailPage, booking: BookingDto, event: Pick<EventDto, 'price'>) {
  const total = Number(event.price) * booking.quantity;

  await expect(eventDetailPage.confirmationHeading).toBeVisible();
  await expect(eventDetailPage.main).toContainText('Your tickets are reserved.');
  await expect(eventDetailPage.confirmationValue('Booking Ref')).toHaveText(booking.bookingRef);
  await expect(eventDetailPage.confirmationValue('Customer')).toHaveText(booking.customerName);
  await expect(eventDetailPage.confirmationValue('Tickets')).toHaveText(String(booking.quantity));
  await expect(eventDetailPage.confirmationValue('Total')).toHaveText(formatPrice(total));
  // The header keeps showing the price per ticket after booking.
  await expect(eventDetailPage.pricePerTicket).toHaveText(formatPrice(Number(event.price)));
  await expect(eventDetailPage.viewMyBookingsLink).toBeVisible();
  await expect(eventDetailPage.browseMoreEventsLink).toBeVisible();
  // What the server stored must agree with what the page shows.
  expect(Number(booking.totalPrice), 'stored total = price per ticket × tickets').toBe(total);
}

/** Wording of the cancel pop-up; it differs between the two places a booking can be cancelled from. */
export const CANCEL_MESSAGES = {
  fromMyBookings: (ref: string, seats: number) =>
    `This will cancel ${ref} and release ${seats} seat(s) back to the event. This action cannot be undone.`,
  fromDetails: (ref: string, seats: number) => `Cancelling ${ref} will release ${seats} seat(s) back to the event. This cannot be undone.`,
} as const;

/**
 * The "Cancel this booking?" pop-up: title, the booking reference, the number of seats that will be
 * released (= the booking's tickets), the full sentence, and the three buttons.
 */
export async function expectCancelDialog(dialog: CancelDialog, booking: BookingDto, from: keyof typeof CANCEL_MESSAGES) {
  await expect(dialog.root).toBeVisible();
  await expect(dialog.title).toHaveText('Cancel this booking?');
  await expect(dialog.message, 'pop-up names this booking').toContainText(booking.bookingRef);
  await expect(dialog.message, 'pop-up states how many seats are released').toContainText(`release ${booking.quantity} seat(s)`);
  await expect(dialog.message).toHaveText(CANCEL_MESSAGES[from](booking.bookingRef, booking.quantity));
  await expect(dialog.keepButton).toHaveText('Cancel');
  await expect(dialog.confirmButton).toHaveText('Yes, cancel it');
  await expect(dialog.closeButton).toBeVisible();
}

/** One booking card in My Bookings: every value on it must match the booking and its event. */
export async function expectBookingCard(myBookingsPage: MyBookingsPage, booking: BookingDto, event: EventDto) {
  const card = myBookingsPage.card(booking.bookingRef);
  const total = Number(event.price) * booking.quantity;

  await expect(card, `card for booking ${booking.bookingRef}`).toHaveCount(1);
  await expect(card.getByText(booking.bookingRef, { exact: true })).toBeVisible();
  await expect(card.getByText('confirmed', { exact: true })).toBeVisible();
  await expect(card.getByTestId('booking-id')).toHaveText(`#${booking.id}`);
  await expect(card.getByRole('heading', { level: 3 })).toHaveText(event.title);
  await expect(card.getByText(`📅 ${cardDate(event.eventDate)}`, { exact: true }), 'event date').toBeVisible();
  await expect(card.getByText(`🎫 ${ticketsLabel(booking.quantity)}`, { exact: true }), 'ticket count').toBeVisible();
  await expect(card.getByText(`📍 ${event.city}`, { exact: true }), 'event city').toBeVisible();
  await expect(card.getByText(`🗓 Booked ${cardDate(booking.createdAt)}`, { exact: true }), 'booking date').toBeVisible();
  await expect(card.getByText(formatPrice(total), { exact: true }), 'total = price per ticket × tickets').toBeVisible();
  await expect(card.getByText('total', { exact: true })).toBeVisible();
  await expect(card.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', `/bookings/${booking.id}`);
  await expect(card.getByTestId('cancel-booking-btn')).toHaveText('Cancel Booking');
}

/** Booking details page: event, customer and payment data must match the booking and its event. */
export async function expectBookingDetails(bookingDetailPage: BookingDetailPage, booking: BookingDto, event: EventDto) {
  const unitPrice = Number(event.price);

  // Header: breadcrumb "My Bookings / <ref>", then the reference badge, the status and the event title.
  await expect(bookingDetailPage.breadcrumb, 'breadcrumb shows the booking reference').toHaveText(`My Bookings/${booking.bookingRef}`);
  await expect(bookingDetailPage.main.getByText(booking.bookingRef, { exact: true }), 'reference in breadcrumb and badge').toHaveCount(2);
  await expect(bookingDetailPage.main.getByText('confirmed', { exact: true })).toBeVisible();
  await expect(bookingDetailPage.eventTitle).toHaveText(event.title);

  await expect(bookingDetailPage.value('Event')).toHaveText(event.title);
  await expect(bookingDetailPage.value('Date'), 'event date').toHaveText(detailDate(event.eventDate));
  await expect(bookingDetailPage.value('Category')).toHaveText(event.category);
  await expect(bookingDetailPage.value('Venue')).toHaveText(event.venue);
  await expect(bookingDetailPage.value('City')).toHaveText(event.city);

  await expect(bookingDetailPage.value('Name')).toHaveText(booking.customerName);
  await expect(bookingDetailPage.value('Email')).toHaveText(booking.customerEmail);
  await expect(bookingDetailPage.value('Phone')).toHaveText(booking.customerPhone);

  await expect(bookingDetailPage.value('Tickets')).toHaveText(String(booking.quantity));
  await expect(bookingDetailPage.value('Price per ticket')).toHaveText(formatPrice(unitPrice));
  await expect(bookingDetailPage.value('Total Paid'), 'Total Paid = price per ticket × tickets').toHaveText(
    formatPrice(unitPrice * booking.quantity),
  );
  await expect(bookingDetailPage.value('Booked on'), 'booking date').toHaveText(detailDate(booking.createdAt));
  await expect(bookingDetailPage.value('Booking ID')).toHaveText(`#${booking.id}`);

  await expect(bookingDetailPage.cancelButton).toBeVisible();
  await expect(bookingDetailPage.checkRefundButton).toHaveText('Check eligibility for refund?');
  await expect(bookingDetailPage.backLink).toBeVisible();
}
