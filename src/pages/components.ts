import { Locator, Page } from '@playwright/test';

/** Pop-up messages shown top-right after an action ("Booking cancelled successfully", "Network Error"...). */
export function toast(page: Page): Locator {
  return page.locator('[aria-live="polite"]');
}

/**
 * Does an action and checks that a pop-up message with the given text appears because of it.
 *
 * The pop-up closes on its own after a few seconds, so a check that only starts AFTER the action
 * can miss it, for example when stepping through a test with --debug. This starts watching
 * BEFORE the action. There is no separate time limit: the test's own timeout applies.
 */
export async function expectToast(page: Page, text: string, action: () => Promise<unknown>): Promise<void> {
  const shown = toast(page).getByText(text).waitFor({ state: 'visible', timeout: 0 });
  shown.catch(() => {}); // if the action itself fails, report that error rather than this one
  await action();
  await shown;
}

/** The value element that directly follows a label ("Total", "Booking Ref", "AVAILABLE"...). */
export function valueOf(scope: Page | Locator, label: string): Locator {
  return scope.getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');
}

/** The "Cancel this booking?" confirmation pop-up, shared by My Bookings and the booking details page. */
export class CancelDialog {
  readonly root: Locator;
  readonly title: Locator;
  /** The sentence under the title, naming the booking reference and the seats to be released. */
  readonly message: Locator;
  readonly keepButton: Locator;
  readonly confirmButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.title = this.root.getByRole('heading', { level: 2 });
    this.message = this.root.locator('p');
    this.keepButton = this.root.getByRole('button', { name: 'Cancel', exact: true });
    this.confirmButton = this.root.getByTestId('confirm-dialog-yes');
    this.closeButton = this.root.getByRole('button', { name: 'Close' });
  }
}
