import { request as playwrightRequest } from '@playwright/test';
import { test, expect } from '../../../src/fixtures';
import { env } from '../../../src/config/env';

test.describe('TC-API-LIST-02: GET /bookings requires a valid token', () => {
  test('no token returns 401 Unauthorized', async ({ anonymousApi }) => {
    const response = await anonymousApi.get('bookings');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: 'Unauthorized' });
  });

  test('an invalid token returns 401 Invalid or expired token', async () => {
    const context = await playwrightRequest.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Authorization: 'Bearer not.a.valid.token' },
    });

    const response = await context.get('bookings');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: 'Invalid or expired token' });
    await context.dispose();
  });
});
