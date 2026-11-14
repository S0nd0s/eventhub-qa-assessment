import { Locator, Page } from '@playwright/test';
import { CancelDialog } from './components';

export class MyBookingsPage {
  readonly heading: Locator;
  readonly cards: Locator;
  readonly emptyState: Locator;
  readonly browseEventsLink: Locator;
  readonly loadError: Locator;
  readonly retryButton: Locator;
  readonly cancelDialog: CancelDialog;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My Bookings', level: 1 });
    this.cards = page.getByTestId('booking-card');
    this.emptyState = page.getByText('No bookings yet', { exact: true });
    this.browseEventsLink = page.locator('main').getByRole('link', { name: 'Browse Events' });
    this.loadError = page.getByText("Couldn't load bookings", { exact: true });
    this.retryButton = page.getByRole('button', { name: 'Retry' });
    this.cancelDialog = new CancelDialog(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/bookings');
  }

  /** The card for one booking, found by its unique reference. */
  card(bookingRef: string): Locator {
    return this.cards.filter({ hasText: bookingRef });
  }

  /** Opens the confirmation pop-up for a booking. */
  async startCancel(bookingRef: string): Promise<void> {
    await this.card(bookingRef).getByTestId('cancel-booking-btn').click();
  }

  /** Cancels a booking: opens the pop-up and confirms. */
  async cancel(bookingRef: string): Promise<void> {
    await this.startCancel(bookingRef);
    await this.cancelDialog.confirmButton.click();
  }

  async viewDetails(bookingRef: string): Promise<void> {
    await this.card(bookingRef).getByRole('link', { name: 'View Details' }).click();
  }
}
