import { Locator, Page, Request } from '@playwright/test';
import { Customer } from '../data/booking.factory';
import { BookingDto } from '../api/types';
import { valueOf } from './components';

/** Validation messages the booking form shows under each field. */
export const FORM_ERRORS = {
  name: 'Name must be at least 2 chars',
  email: 'Enter a valid email',
  phone: 'Enter a valid 10-digit phone',
} as const;

const isCreateBooking = (request: Request) => request.method() === 'POST' && /\/api\/bookings$/.test(request.url());

export class EventDetailPage {
  readonly main: Locator;
  readonly title: Locator;
  readonly bookingHeading: Locator;
  /** The price shown next to "Book Tickets" in the card header. */
  readonly pricePerTicket: Locator;
  readonly perTicketLabel: Locator;
  readonly ticketCount: Locator;
  readonly increaseTickets: Locator;
  readonly decreaseTickets: Locator;
  readonly maxHint: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  /** The submit button: "Confirm Booking", or "Sold Out" when no seats are left. */
  readonly submitButton: Locator;
  readonly confirmationHeading: Locator;
  readonly viewMyBookingsLink: Locator;
  readonly browseMoreEventsLink: Locator;
  readonly notFoundHeading: Locator;
  readonly browseEventsLink: Locator;

  constructor(private readonly page: Page) {
    this.main = page.locator('main');
    this.title = page.getByRole('heading', { level: 1 });
    this.bookingHeading = page.getByRole('heading', { name: 'Book Tickets' });
    this.pricePerTicket = this.bookingHeading.locator('xpath=following-sibling::span[1]');
    this.perTicketLabel = this.main.getByText('per ticket', { exact: true });
    this.ticketCount = page.locator('#ticket-count');
    this.increaseTickets = page.getByRole('button', { name: '+', exact: true });
    this.decreaseTickets = page.getByRole('button', { name: '−', exact: true });
    this.maxHint = page.getByText(/^\(max \d+\)$/);
    this.nameInput = page.locator('#customerName');
    this.emailInput = page.locator('#customer-email');
    this.phoneInput = page.locator('#phone');
    this.submitButton = page.locator('#confirm-booking');
    this.confirmationHeading = page.getByRole('heading', { name: /Booking Confirmed/ });
    this.viewMyBookingsLink = this.main.getByRole('link', { name: 'View My Bookings' });
    this.browseMoreEventsLink = this.main.getByRole('link', { name: 'Browse More Events' });
    this.notFoundHeading = page.getByText('Event not found', { exact: true });
    this.browseEventsLink = this.main.getByRole('link', { name: 'Browse Events' });
  }

  async open(eventId: number | string): Promise<void> {
    await this.page.goto(`/events/${eventId}`);
  }

  /** A value in the event information block: "Venue", "City", "Available", "Price per ticket". */
  info(label: string): Locator {
    return valueOf(this.main, label);
  }

  /** The ticket counter starts at 1 and only has +/- buttons. */
  async selectTickets(quantity: number): Promise<void> {
    for (let i = 1; i < quantity; i++) await this.increaseTickets.click();
  }

  async fillCustomer(customer: Partial<Customer>): Promise<void> {
    if (customer.name !== undefined) await this.nameInput.fill(customer.name);
    if (customer.email !== undefined) await this.emailInput.fill(customer.email);
    if (customer.phone !== undefined) await this.phoneInput.fill(customer.phone);
  }

  error(field: keyof typeof FORM_ERRORS): Locator {
    return this.page.getByText(FORM_ERRORS[field], { exact: true });
  }

  /** The order summary line, e.g. "$250 × 2 tickets". */
  summaryLine(text: string): Locator {
    return this.main.getByText(text, { exact: true });
  }

  /** The amount shown at the end of that summary line. */
  summaryLineAmount(text: string): Locator {
    return this.summaryLine(text).locator('xpath=following-sibling::span[1]');
  }

  /** The "Total" row of the order summary, shown before confirming. */
  orderTotal(): Locator {
    return valueOf(this.main, 'Total');
  }

  /**
   * Starts recording "create booking" requests sent by the page.
   * Lets a test prove that an invalid form never reached the server.
   */
  recordBookingRequests(): Request[] {
    const requests: Request[] = [];
    this.page.on('request', (request) => {
      if (isCreateBooking(request)) requests.push(request);
    });
    return requests;
  }

  /**
   * Clicks Confirm Booking and returns the booking the backend created,
   * so the test can compare what the UI shows with what was stored.
   */
  async confirm(): Promise<BookingDto> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => isCreateBooking(r.request())),
      this.submitButton.click(),
    ]);
    return (await response.json()).data;
  }

  /** A value in the confirmation panel, by its label ("Booking Ref", "Customer", "Tickets", "Total"). */
  confirmationValue(label: string): Locator {
    return valueOf(this.main, label);
  }
}
