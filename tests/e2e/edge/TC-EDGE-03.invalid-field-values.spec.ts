import { test, expect } from '../../../src/fixtures';
import { aCustomer, Customer } from '../../../src/data/booking.factory';
import { FORM_ERRORS } from '../../../src/pages/event-detail.page';

const INVALID_VALUES: { name: string; change: Partial<Customer>; error: keyof typeof FORM_ERRORS }[] = [
  { name: 'name with 1 character', change: { name: 'A' }, error: 'name' },
  { name: 'name with only spaces', change: { name: '   ' }, error: 'name' },
  { name: 'email without @', change: { email: 'not-an-email' }, error: 'email' },
  { name: 'email without a domain ending', change: { email: 'user@domain' }, error: 'email' },
  { name: 'phone with fewer than 10 digits', change: { phone: '12345' }, error: 'phone' },
  { name: 'phone with letters', change: { phone: 'abcdefghijkl' }, error: 'phone' },
];


test('TC-EDGE-03: invalid values are rejected with the right message', async ({ createEvent, eventsApi, eventDetailPage }) => {
  const event = await createEvent({ totalSeats: 10 });
  await eventDetailPage.open(event.id);

  const requests = eventDetailPage.recordBookingRequests();

  for (const { name, change, error } of INVALID_VALUES) {
    await test.step(name, async () => {
      await eventDetailPage.open(event.id);
      await eventDetailPage.fillCustomer({ ...aCustomer(), ...change });
      await eventDetailPage.submitButton.click();

      await expect(eventDetailPage.error(error)).toHaveText(FORM_ERRORS[error]);
      await expect(eventDetailPage.confirmationHeading).toBeHidden();
    });
  }

  await test.step('none of the cases sent a booking or took a seat', async () => {
    expect(requests, 'an invalid form must not reach the server').toHaveLength(0);
    expect(await eventsApi.availableSeats(event.id)).toBe(10);
  });
});
