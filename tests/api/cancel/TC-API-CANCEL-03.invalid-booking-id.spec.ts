import { test, expect } from '../../../src/fixtures';

test.describe('TC-API-CANCEL-03: DELETE /bookings/{id} with an id that was never a booking', () => {
  for (const id of [99999999, 0, -1]) {
    test(`id ${id} returns 404`, async ({ bookingsApi }) => {
      const response = await bookingsApi.cancelRaw(id);

      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({ success: false, error: `Booking with id ${id} not found` });
    });
  }

  test('BUG: a non-numeric id is a client error, not a server error', async ({ bookingsApi }) => {
    // Real defect, left failing on purpose so it shows red in every report until it is fixed.
    test.info().annotations.push({
      type: 'bug',
      description: 'DELETE /bookings/abc returns 500 Internal server error instead of 400/404',
    });

    const response = await bookingsApi.cancelRaw('abc');

    expect([400, 404]).toContain(response.status());
  });
});
