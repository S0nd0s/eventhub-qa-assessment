import { test, expect } from '../../src/fixtures';
import { visualEvent } from '../../src/data/visual';

test('TC-VIS-02: booking form with validation errors matches the baseline', async ({ createEvent, eventDetailPage, page }) => {
  const event = await createEvent(visualEvent('TC-VIS-02'));

  await eventDetailPage.open(event.id);
  await eventDetailPage.submitButton.click();
  await expect(eventDetailPage.error('phone')).toBeVisible();
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expect(eventDetailPage.main).toHaveScreenshot('TC-VIS-02-validation-errors.png');
});
