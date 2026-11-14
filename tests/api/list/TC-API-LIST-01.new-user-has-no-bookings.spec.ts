import { test, expect } from '../../../src/fixtures';


test('TC-API-LIST-01: GET /bookings for a new user returns an empty list', async ({ newUser }) => {
  const response = await newUser.bookingsApi.listRaw();

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  });
});
