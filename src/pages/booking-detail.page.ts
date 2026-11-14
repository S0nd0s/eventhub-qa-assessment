import { Locator, Page } from '@playwright/test';
import { CancelDialog, valueOf } from './components';

/** Refund rule shown by the app: only single-ticket bookings are refundable. */
export const REFUND_MESSAGES = {
  eligible: 'Eligible for refund. Single-ticket bookings qualify for a full refund.',
  notEligible: (tickets: number) => `Not eligible for refund. Group bookings (${tickets} tickets) are non-refundable.`,
} as const;

export class BookingDetailPage {
  readonly main: Locator;
  /** "My Bookings / <booking ref>" above the title. */
  readonly breadcrumb: Locator;
  readonly eventTitle: Locator;
  readonly cancelButton: Locator;
  readonly checkRefundButton: Locator;
  readonly refundResult: Locator;
  readonly backLink: Locator;
  readonly notFoundHeading: Locator;
  readonly viewMyBookingsLink: Locator;
  readonly cancelDialog: CancelDialog;

  constructor(private readonly page: Page) {
    this.main = page.locator('main');
    this.breadcrumb = this.main.locator('nav').first();
    this.eventTitle = page.getByRole('heading', { level: 1 });
    this.cancelButton = this.main.getByRole('button', { name: 'Cancel Booking' });
    this.checkRefundButton = page.getByTestId('check-refund-btn');
    this.refundResult = page.getByTestId('refund-result');
    this.backLink = this.main.getByRole('link', { name: '← Back to My Bookings' });
    this.notFoundHeading = page.getByText('Booking not found', { exact: true });
    this.viewMyBookingsLink = this.main.getByRole('link', { name: 'View My Bookings' });
    this.cancelDialog = new CancelDialog(page);
  }

  async open(bookingId: number | string): Promise<void> {
    await this.page.goto(`/bookings/${bookingId}`);
  }

  /** A value by its label: "Name", "Email", "Phone", "Tickets", "Price per ticket", "Total Paid", "Booking ID"... */
  value(label: string): Locator {
    return valueOf(this.main, label);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.cancelDialog.confirmButton.click();
  }
}
