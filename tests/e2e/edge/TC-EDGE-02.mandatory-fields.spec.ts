import { test, expect } from '../../../src/fixtures';
import { aCustomer, Customer } from '../../../src/data/booking.factory';
import { FORM_ERRORS } from '../../../src/pages/event-detail.page';

const FIELDS: { field: keyof Customer; error: keyof typeof FORM_ERRORS }[] = [
  { field: 'name', error: 'name' },
  { field: 'email', error: 'email' },
  { field: 'phone', error: 'phone' },
];


test('TC-EDGE-02: name, email and phone are all mandatory', async ({ createEvent, eventsApi, eventDetailPage }) => {
  const event = await createEvent({ totalSeats: 10 });
  await eventDetailPage.open(event.id);
  
  const requests = eventDetailPage.recordBookingRequests();

  await test.step('all three fields are marked as required', async () => {
    for (const input of [eventDetailPage.nameInput, eventDetailPage.emailInput, eventDetailPage.phoneInput]) {
      await expect(input).toHaveAttribute('required', '');
    }
    await expect(eventDetailPage.main).toContainText('Full Name*');
    await expect(eventDetailPage.main).toContainText('Email*');
    await expect(eventDetailPage.main).toContainText('Phone Number*');
  });

  await test.step('no errors are shown before the user tries to submit', async () => {
    for (const { error } of FIELDS) await expect(eventDetailPage.error(error)).toBeHidden();
    // validation happens on click.
    await expect(eventDetailPage.submitButton).toBeEnabled();
  });

  await test.step('submitting an empty form shows an error under every field', async () => {
    await eventDetailPage.submitButton.click();
    await expect(eventDetailPage.error('name')).toHaveText(FORM_ERRORS.name);
    await expect(eventDetailPage.error('email')).toHaveText(FORM_ERRORS.email);
    await expect(eventDetailPage.error('phone')).toHaveText(FORM_ERRORS.phone);
    await expect(eventDetailPage.confirmationHeading).toBeHidden();
  });

  for (const { field, error } of FIELDS) {
    await test.step(`leaving only the ${field} empty shows only the ${field} error`, async () => {
      await eventDetailPage.open(event.id);
      await eventDetailPage.fillCustomer({ ...aCustomer(), [field]: '' });
      await eventDetailPage.submitButton.click();

      await expect(eventDetailPage.error(error)).toHaveText(FORM_ERRORS[error]);
      for (const other of FIELDS.filter((f) => f.field !== field)) {
        await expect(eventDetailPage.error(other.error)).toBeHidden();
      }
      await expect(eventDetailPage.confirmationHeading).toBeHidden();
    });
  }

  await test.step('none of the cases sent a booking or took a seat', async () => {
    expect(requests, 'an incomplete form must not reach the server').toHaveLength(0);
    expect(await eventsApi.availableSeats(event.id)).toBe(10);
  });
});
