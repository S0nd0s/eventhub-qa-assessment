import { test, expect } from '../../../src/fixtures';
import { aBookingRequest } from '../../../src/data/booking.factory';

const invalidFields: { name: string; change: Record<string, unknown>; field: string; message: string }[] = [
  { name: 'name with 1 character', change: { customerName: 'A' }, field: 'customerName', message: 'Customer name must be at least 2 characters' },
  { name: 'name missing', change: { customerName: undefined }, field: 'customerName', message: 'Customer name is required' },
  { name: 'email without @', change: { customerEmail: 'not-an-email' }, field: 'customerEmail', message: 'Customer email must be a valid email address' },
  { name: 'email missing', change: { customerEmail: undefined }, field: 'customerEmail', message: 'Customer email is required' },
  { name: 'phone shorter than 10 digits', change: { customerPhone: '123' }, field: 'customerPhone', message: 'Customer phone must be at least 10 digits' },
  { name: 'phone with letters', change: { customerPhone: 'abcdefghijkl' }, field: 'customerPhone', message: 'Customer phone must contain only digits and +, -, spaces, or parentheses' },
  { name: 'phone missing', change: { customerPhone: undefined }, field: 'customerPhone', message: 'Customer phone is required' },
  { name: 'event id not a number', change: { eventId: 'abc' }, field: 'eventId', message: 'Event ID must be a positive integer' },
  { name: 'event id missing', change: { eventId: undefined }, field: 'eventId', message: 'Event ID is required' },
];

test.describe('TC-API-CREATE-06: POST /bookings validates every field', () => {
  for (const { name, change, field, message } of invalidFields) {
    test(name, async ({ createEvent, bookingsApi }) => {
      const event = await createEvent();

      const response = await bookingsApi.createRaw({ ...aBookingRequest(event.id), ...change });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContainEqual({ field, message });
    });
  }

  test('an empty body reports every required field at once', async ({ bookingsApi }) => {
    const response = await bookingsApi.createRaw({});

    expect(response.status()).toBe(400);
    const fields = new Set((await response.json()).details.map((d: { field: string }) => d.field));
    expect([...fields].sort()).toEqual(['customerEmail', 'customerName', 'customerPhone', 'eventId', 'quantity']);
  });
});
