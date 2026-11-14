import { Page, Route } from '@playwright/test';
import { BookingDto, EventDto } from '../api/types';
import { expectConfirmation, expectOrderSummary } from '../assertions/booking.assertions';
import { aCustomer, Customer } from '../data/booking.factory';
import { EventDetailPage } from '../pages/event-detail.page';

/**
 * Reusable steps shared by several test cases.
 *
 * Test cases never depend on each other: a test that needs "a booking exists" calls a step
 * from here (or the API) to create its own. That keeps every test runnable alone and in parallel.
 */

/**
 * The full "book tickets through the browser" step: open event, pick quantity, fill form, confirm.
 * It also checks the prices on the way: price per ticket, "price × tickets" and total before
 * confirming, and the confirmation panel afterwards.
 */
export async function bookThroughUi(
  eventDetailPage: EventDetailPage,
  event: EventDto,
  quantity = 1,
  customer: Customer = aCustomer(),
): Promise<{ booking: BookingDto; customer: Customer }> {
  await eventDetailPage.open(event.id);
  await eventDetailPage.selectTickets(quantity);
  await expectOrderSummary(eventDetailPage, event, quantity);
  await eventDetailPage.fillCustomer(customer);
  const booking = await eventDetailPage.confirm();
  await expectConfirmation(eventDetailPage, booking, event);
  return { booking, customer };
}

/** URL patterns of the API calls the booking flow makes. */
export const API_ROUTES = {
  createBooking: /\/api\/bookings$/,
  listBookings: /\/api\/bookings(\?.*)?$/,
  oneBooking: /\/api\/bookings\/\d+$/,
  listEvents: /\/api\/events\?/,
  oneEvent: /\/api\/events\/\d+$/,
} as const;

type Failure = { status: number; error: string } | 'network';

/**
 * Makes one API call fail in the browser, to check how the UI reports it.
 * Only the given HTTP method is affected; everything else reaches the real server.
 * Returns a function that removes the simulated failure again.
 */
export async function simulateFailure(page: Page, url: RegExp, method: string, failure: Failure): Promise<() => Promise<void>> {
  const handler = async (route: Route) => {
    if (route.request().method() !== method) return route.fallback();
    if (failure === 'network') return route.abort('failed');
    return route.fulfill({
      status: failure.status,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: failure.error }),
    });
  };
  await page.route(url, handler);
  return () => page.unroute(url, handler);
}

export const SERVER_ERROR: Failure = { status: 500, error: 'Internal server error' };
