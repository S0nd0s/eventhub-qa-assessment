import { Locator, Page } from '@playwright/test';

export class EventsPage {
  readonly heading: Locator;
  readonly cards: Locator;
  readonly loadError: Locator;
  readonly retryButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Upcoming Events', level: 1 });
    this.cards = page.getByTestId('event-card');
    this.loadError = page.getByText("Couldn't load events", { exact: true });
    this.retryButton = page.getByRole('button', { name: 'Retry' });
  }

  async open(): Promise<void> {
    await this.page.goto('/events');
  }

  /** The card of one event, found by its (unique) title. */
  card(title: string): Locator {
    return this.cards.filter({ hasText: title });
  }

  /** The action link on a card: "Book Now", or "Sold Out" when no seats are left. */
  cardAction(title: string): Locator {
    return this.card(title).getByTestId('book-now-btn');
  }
}
